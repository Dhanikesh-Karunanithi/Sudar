/**
 * Proxy to Sudar Intelligence image generation (Together FLUX) when configured.
 */
import { createClient, createServiceRoleSupabaseClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { resolveLearnerPreferences } from '@/lib/learner/learnerPreferences'

const INTELLIGENCE_URL = (process.env.SUDAR_INTELLIGENCE_URL ?? process.env.BYTEOS_INTELLIGENCE_URL)?.replace(/\/$/, '')
const INTELLIGENCE_SERVICE_SECRET = process.env.INTELLIGENCE_SERVICE_SECRET?.trim()

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json().catch(() => ({}))
  const prompt = typeof body.prompt === 'string' ? body.prompt.trim() : ''
  if (!prompt) return NextResponse.json({ error: 'prompt required' }, { status: 400 })

  if (!INTELLIGENCE_URL) {
    return NextResponse.json({ error: 'intelligence_unavailable' }, { status: 501 })
  }

  const admin = createServiceRoleSupabaseClient()
  const { data: profile } = await admin
    .from('learner_profiles')
    .select('learner_preferences')
    .eq('user_id', user.id)
    .maybeSingle()
  const prefs = resolveLearnerPreferences(profile?.learner_preferences ?? null)

  const { data: { session } } = await supabase.auth.getSession()
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  if (session?.access_token) headers.Authorization = `Bearer ${session.access_token}`
  if (INTELLIGENCE_SERVICE_SECRET) headers['X-Intelligence-Service-Secret'] = INTELLIGENCE_SERVICE_SECRET

  const res = await fetch(`${INTELLIGENCE_URL}/api/image/generate`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      prompt: prompt.slice(0, 2000),
      model: typeof body.model === 'string' ? body.model : undefined,
      language: prefs.content_language,
      culture_context: typeof body.culture_context === 'string' ? body.culture_context : undefined,
      style: typeof body.style === 'string' ? body.style : undefined,
    }),
  })

  const text = await res.text()
  if (!res.ok) {
    return NextResponse.json({ error: text || res.statusText }, { status: res.status })
  }
  try {
    return NextResponse.json(JSON.parse(text))
  } catch {
    return NextResponse.json({ error: 'Invalid upstream response' }, { status: 502 })
  }
}

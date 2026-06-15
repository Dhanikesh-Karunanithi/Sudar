import { createClient, createServiceRoleSupabaseClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { simScenarioSchema } from '@shared-sudarsim/schemas'

const INTELLIGENCE_URL = (process.env.SUDAR_INTELLIGENCE_URL ?? process.env.BYTEOS_INTELLIGENCE_URL ?? 'http://localhost:8001').replace(/\/$/, '')

async function proxyIntelligence(path: string, body: unknown) {
  const secret = process.env.INTELLIGENCE_SERVICE_SECRET?.trim()
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  if (secret) headers['X-Intelligence-Service-Secret'] = secret
  const res = await fetch(`${INTELLIGENCE_URL}/api/sim${path}`, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  })
  if (!res.ok) throw new Error(await res.text())
  return res.json()
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  try {
    const result = await proxyIntelligence('/scenario/generate', body)
    return NextResponse.json({ success: true, scenario: result.scenario })
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Failed' }, { status: 502 })
  }
}

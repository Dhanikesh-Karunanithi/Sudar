/**
 * Proxy to Learn's embed-token. Admin/Manager passes their ALP key + user_id to get an embed URL.
 */
import { createClient } from '@/lib/supabase/server'
import { requireOrgAdmin } from '@/lib/org'
import { NextRequest, NextResponse } from 'next/server'

const LEARN_URL = process.env.NEXT_PUBLIC_LEARN_APP_URL || process.env.LEARN_APP_URL || ''

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    await requireOrgAdmin(user.id)
  } catch {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  if (!LEARN_URL) {
    return NextResponse.json({ error: 'Learn app URL not configured (NEXT_PUBLIC_LEARN_APP_URL)' }, { status: 503 })
  }

  let body: { key: string; user_id: string; course_id?: string; module_id?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const { key, user_id, course_id, module_id } = body
  if (!key?.trim() || !user_id?.trim()) {
    return NextResponse.json({ error: 'key and user_id required' }, { status: 400 })
  }

  const base = LEARN_URL.replace(/\/$/, '')
  const res = await fetch(`${base}/api/alp/embed-token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-alp-api-key': key.trim() },
    body: JSON.stringify({ user_id: user_id.trim(), course_id: course_id?.trim() || undefined, module_id: module_id?.trim() || undefined }),
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    return NextResponse.json(
      { error: (err as { error?: string }).error || `Learn returned ${res.status}` },
      { status: res.status }
    )
  }

  const data = (await res.json()) as { embed_url?: string; expires_in?: number }
  return NextResponse.json({ embed_url: data.embed_url, expires_in: data.expires_in })
}

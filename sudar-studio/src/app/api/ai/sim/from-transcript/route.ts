import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

const INTELLIGENCE_URL = (process.env.SUDAR_INTELLIGENCE_URL ?? process.env.BYTEOS_INTELLIGENCE_URL ?? 'http://localhost:8001').replace(/\/$/, '')

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const secret = process.env.INTELLIGENCE_SERVICE_SECRET?.trim()
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  if (secret) headers['X-Intelligence-Service-Secret'] = secret

  const res = await fetch(`${INTELLIGENCE_URL}/api/sim/scenario/from-transcript`, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  })
  if (!res.ok) return NextResponse.json({ error: await res.text() }, { status: 502 })
  const result = await res.json()
  return NextResponse.json({ success: true, scenario: result.scenario })
}

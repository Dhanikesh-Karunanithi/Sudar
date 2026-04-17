import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient, createClient } from '@/lib/supabase/server'

function normalizeDate(input: string | null): string {
  if (!input) return new Date().toISOString().slice(0, 10)
  const parsed = new Date(input)
  if (Number.isNaN(parsed.getTime())) return new Date().toISOString().slice(0, 10)
  return parsed.toISOString().slice(0, 10)
}

export async function POST(request: NextRequest) {
  if (process.env.ENABLE_ANALYTICS_ENGINE === 'false') {
    return NextResponse.json({ success: false, error: 'Analytics engine disabled' }, { status: 503 })
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })

  const body = await request.json().catch(() => ({} as Record<string, unknown>))
  const eventDate = normalizeDate(typeof body.date === 'string' ? body.date : null)

  const admin = createAdminClient()
  const [{ error: rollupError }, { error: riskError }] = await Promise.all([
    admin.rpc('refresh_analytics_rollups', { p_date: eventDate }),
    admin.rpc('refresh_analytics_risk_signals', { p_date: eventDate }),
  ])

  if (rollupError || riskError) {
    return NextResponse.json(
      { success: false, error: rollupError?.message ?? riskError?.message ?? 'Refresh failed' },
      { status: 500 }
    )
  }

  return NextResponse.json({ success: true, refreshed_for: eventDate })
}

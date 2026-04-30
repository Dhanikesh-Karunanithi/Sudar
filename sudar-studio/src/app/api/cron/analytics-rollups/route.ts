/**
 * Analytics rollup refresh cron endpoint.
 * Trigger daily (recommended) with CRON_SECRET.
 */
import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { rejectInvalidCronRequest } from '@/lib/security/cronAuth'

function normalizeDate(input: string | null): string {
  if (!input) return new Date().toISOString().slice(0, 10)
  const parsed = new Date(input)
  if (Number.isNaN(parsed.getTime())) return new Date().toISOString().slice(0, 10)
  return parsed.toISOString().slice(0, 10)
}

export async function POST(request: NextRequest) {
  if (process.env.ENABLE_ANALYTICS_ENGINE === 'false') {
    return NextResponse.json({ error: 'Analytics engine disabled' }, { status: 503 })
  }

  const cronError = rejectInvalidCronRequest(request)
  if (cronError) return cronError

  const body = await request.json().catch(() => ({} as Record<string, unknown>))
  const targetDate = normalizeDate(
    typeof body.date === 'string' ? body.date : request.nextUrl.searchParams.get('date')
  )

  const admin = createAdminClient()
  const [{ error: rollupError }, { error: riskError }] = await Promise.all([
    admin.rpc('refresh_analytics_rollups', { p_date: targetDate }),
    admin.rpc('refresh_analytics_risk_signals', { p_date: targetDate }),
  ])

  if (rollupError || riskError) {
    return NextResponse.json(
      { error: rollupError?.message ?? riskError?.message ?? 'Refresh failed' },
      { status: 500 }
    )
  }

  return NextResponse.json({
    ok: true,
    refreshed_for: targetDate,
    jobs: ['refresh_analytics_rollups', 'refresh_analytics_risk_signals'],
  })
}

/**
 * Refresh ai_usage_daily_org from raw ai_usage_events. Run daily with CRON_SECRET.
 */
import { NextRequest, NextResponse } from 'next/server'
import { createServiceRoleSupabaseClient } from '@/lib/supabase/server'
import { aiUsageDb } from '@/lib/ai/usageSupabase'
import { rejectInvalidCronRequest } from '@/lib/security/cronAuth'

function normalizeDate(input: string | null): string {
  if (!input) {
    const d = new Date()
    d.setUTCDate(d.getUTCDate() - 1)
    return d.toISOString().slice(0, 10)
  }
  const parsed = new Date(input)
  if (Number.isNaN(parsed.getTime())) {
    const d = new Date()
    d.setUTCDate(d.getUTCDate() - 1)
    return d.toISOString().slice(0, 10)
  }
  return parsed.toISOString().slice(0, 10)
}

export async function POST(request: NextRequest) {
  const cronError = rejectInvalidCronRequest(request)
  if (cronError) return cronError

  const body = await request.json().catch(() => ({} as Record<string, unknown>))
  const targetDate = normalizeDate(
    typeof body.date === 'string' ? body.date : request.nextUrl.searchParams.get('date')
  )

  const admin = aiUsageDb(createServiceRoleSupabaseClient())
  const { error } = await admin.rpc('refresh_ai_usage_rollups', { p_date: targetDate })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true, refreshed_for: targetDate })
}

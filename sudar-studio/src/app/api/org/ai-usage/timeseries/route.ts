import { createClient, createServiceRoleSupabaseClient } from '@/lib/supabase/server'
import { requireOrgAdmin } from '@/lib/org'
import { NextRequest, NextResponse } from 'next/server'
import { parseUsageDateRange } from '@/lib/ai/usageQuery'
import { aiUsageDb } from '@/lib/ai/usageSupabase'

export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let orgId: string
  try {
    orgId = await requireOrgAdmin(user.id)
  } catch {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { from, to } = parseUsageDateRange(request.nextUrl.searchParams)
  const admin = aiUsageDb(createServiceRoleSupabaseClient())

  const { data: rows, error } = await admin
    .from('ai_usage_daily_org')
    .select('event_date, total_tokens, estimated_cost_usd, request_count')
    .eq('org_id', orgId)
    .gte('event_date', from)
    .lte('event_date', to)
    .order('event_date', { ascending: true })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const byDate = new Map<
    string,
    { event_date: string; total_tokens: number; estimated_cost_usd: number; request_count: number }
  >()

  type TsRow = {
    event_date: string
    total_tokens: number
    estimated_cost_usd: number
    request_count: number
  }
  for (const row of (rows ?? []) as TsRow[]) {
    const date = String(row.event_date).slice(0, 10)
    const existing = byDate.get(date) ?? {
      event_date: date,
      total_tokens: 0,
      estimated_cost_usd: 0,
      request_count: 0,
    }
    existing.total_tokens += Number(row.total_tokens) || 0
    existing.estimated_cost_usd += Number(row.estimated_cost_usd) || 0
    existing.request_count += row.request_count ?? 0
    byDate.set(date, existing)
  }

  return NextResponse.json({
    success: true,
    data: {
      from,
      to,
      points: [...byDate.values()].sort((a, b) => a.event_date.localeCompare(b.event_date)),
    },
  })
}

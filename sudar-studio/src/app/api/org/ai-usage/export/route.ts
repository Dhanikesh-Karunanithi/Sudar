import { createClient, createServiceRoleSupabaseClient } from '@/lib/supabase/server'
import { requireOrgAdmin } from '@/lib/org'
import { NextRequest, NextResponse } from 'next/server'
import { parseUsageDateRange } from '@/lib/ai/usageQuery'
import { aiUsageDb } from '@/lib/ai/usageSupabase'

function csvEscape(value: string | number | null | undefined): string {
  const s = value == null ? '' : String(value)
  if (s.includes(',') || s.includes('"') || s.includes('\n')) {
    return `"${s.replace(/"/g, '""')}"`
  }
  return s
}

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
    .select(
      'event_date, feature, request_count, prompt_tokens, completion_tokens, total_tokens, estimated_cost_usd'
    )
    .eq('org_id', orgId)
    .gte('event_date', from)
    .lte('event_date', to)
    .order('event_date', { ascending: true })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const header =
    'event_date,feature,request_count,prompt_tokens,completion_tokens,total_tokens,estimated_cost_usd'
  type ExportRow = {
    event_date: string
    feature: string
    request_count: number
    prompt_tokens: number
    completion_tokens: number
    total_tokens: number
    estimated_cost_usd: number
  }
  const lines = ((rows ?? []) as ExportRow[]).map((r) =>
    [
      csvEscape(r.event_date),
      csvEscape(r.feature),
      csvEscape(r.request_count),
      csvEscape(r.prompt_tokens),
      csvEscape(r.completion_tokens),
      csvEscape(r.total_tokens),
      csvEscape(r.estimated_cost_usd),
    ].join(',')
  )

  const csv = [header, ...lines].join('\n')

  return new NextResponse(csv, {
    status: 200,
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="sudar-ai-usage-${from}-${to}.csv"`,
    },
  })
}

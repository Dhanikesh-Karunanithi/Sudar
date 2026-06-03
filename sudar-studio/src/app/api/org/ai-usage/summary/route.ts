import { createClient, createServiceRoleSupabaseClient } from '@/lib/supabase/server'
import { requireOrgAdmin } from '@/lib/org'
import { NextRequest, NextResponse } from 'next/server'
import { aggregateRollupRows, parseUsageDateRange } from '@/lib/ai/usageQuery'
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

  const { data: rollupRows, error } = await admin
    .from('ai_usage_daily_org')
    .select('feature, request_count, prompt_tokens, completion_tokens, total_tokens, estimated_cost_usd')
    .eq('org_id', orgId)
    .gte('event_date', from)
    .lte('event_date', to)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const { totals, by_feature } = aggregateRollupRows(rollupRows ?? [])

  return NextResponse.json({
    success: true,
    data: {
      from,
      to,
      estimate_disclaimer:
        'Costs are marginal AI estimates from ai_model_pricing reference rates, not invoices or TCO.',
      totals,
      by_feature,
    },
  })
}

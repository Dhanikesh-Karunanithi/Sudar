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

  const limit = Math.min(50, Math.max(1, Number(request.nextUrl.searchParams.get('limit') ?? 20)))
  const { from, to } = parseUsageDateRange(request.nextUrl.searchParams)
  const fromIso = `${from}T00:00:00.000Z`
  const toIso = `${to}T23:59:59.999Z`

  const admin = aiUsageDb(createServiceRoleSupabaseClient())
  const { data: events, error } = await admin
    .from('ai_usage_events')
    .select('user_id, total_tokens, estimated_cost_usd')
    .eq('org_id', orgId)
    .gte('created_at', fromIso)
    .lte('created_at', toIso)
    .not('user_id', 'is', null)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const byUser = new Map<string, { total_tokens: number; estimated_cost_usd: number; request_count: number }>()
  type EventRow = { user_id: string; total_tokens: number | null; estimated_cost_usd: number | null }
  for (const e of (events ?? []) as EventRow[]) {
    const uid = e.user_id as string
    const row = byUser.get(uid) ?? { total_tokens: 0, estimated_cost_usd: 0, request_count: 0 }
    row.request_count += 1
    row.total_tokens += Number(e.total_tokens) || 0
    row.estimated_cost_usd += Number(e.estimated_cost_usd) || 0
    byUser.set(uid, row)
  }

  const sorted = [...byUser.entries()]
    .sort((a, b) => b[1].total_tokens - a[1].total_tokens)
    .slice(0, limit)

  const userIds = sorted.map(([id]) => id)
  const { data: profiles } = userIds.length
    ? await admin.from('profiles').select('id, full_name').in('id', userIds)
    : { data: [] }

  const profileMap = new Map(
    ((profiles ?? []) as Array<{ id: string; full_name: string | null }>).map((p) => [p.id, p])
  )

  return NextResponse.json({
    success: true,
    data: {
      from,
      to,
      users: sorted.map(([user_id, stats]) => ({
        user_id,
        full_name: profileMap.get(user_id)?.full_name ?? null,
        email: null,
        ...stats,
      })),
    },
  })
}

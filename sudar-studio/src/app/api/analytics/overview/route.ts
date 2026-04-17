import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient, createClient } from '@/lib/supabase/server'
import { getOrCreateOrg } from '@/lib/org'

export async function GET(request: NextRequest) {
  if (process.env.ENABLE_ANALYTICS_ENGINE === 'false') {
    return NextResponse.json({ success: false, error: 'Analytics engine disabled' }, { status: 503 })
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })

  const orgId = await getOrCreateOrg(user.id)
  const admin = createAdminClient()
  const days = Math.max(1, Math.min(90, Number(request.nextUrl.searchParams.get('days') ?? '30')))
  const since = new Date(Date.now() - days * 86400000).toISOString().slice(0, 10)

  const { data, error } = await admin
    .from('analytics_org_rollup')
    .select('active_learners, active_learning_secs, idle_secs, total_secs, completion_count, drop_off_count, avg_engagement_score')
    .eq('org_id', orgId)
    .gte('event_date', since)

  if (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }

  const aggregate = (data ?? []).reduce(
    (acc, row) => {
      acc.active_learners = Math.max(acc.active_learners, Number(row.active_learners ?? 0))
      acc.active_learning_secs += Number(row.active_learning_secs ?? 0)
      acc.idle_secs += Number(row.idle_secs ?? 0)
      acc.total_secs += Number(row.total_secs ?? 0)
      acc.completion_count += Number(row.completion_count ?? 0)
      acc.drop_off_count += Number(row.drop_off_count ?? 0)
      acc.avg_engagement_score += Number(row.avg_engagement_score ?? 0)
      return acc
    },
    {
      active_learners: 0,
      active_learning_secs: 0,
      idle_secs: 0,
      total_secs: 0,
      completion_count: 0,
      drop_off_count: 0,
      avg_engagement_score: 0,
    }
  )

  const rows = data?.length ?? 0
  const avgEngagementScore = rows > 0 ? aggregate.avg_engagement_score / rows : 0
  const focusRatio = aggregate.total_secs > 0 ? aggregate.active_learning_secs / aggregate.total_secs : 0

  return NextResponse.json({
    success: true,
    data: {
      ...aggregate,
      avg_engagement_score: Number(avgEngagementScore.toFixed(4)),
      focus_ratio: Number(focusRatio.toFixed(4)),
    },
  })
}

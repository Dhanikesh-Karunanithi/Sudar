import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient, createClient } from '@/lib/supabase/server'
import { computeCompletionVelocity, computeEngagementScore, computeFocusRatio } from '@/types/analytics'
import { z } from 'zod'

const querySchema = z.object({
  days: z.coerce.number().int().min(1).max(90).default(14),
})

export async function GET(request: NextRequest) {
  if (process.env.ENABLE_ANALYTICS_ENGINE === 'false') {
    return NextResponse.json({ success: false, error: 'Analytics engine disabled' }, { status: 503 })
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })

  const parsed = querySchema.safeParse({
    days: request.nextUrl.searchParams.get('days') ?? '14',
  })
  if (!parsed.success) return NextResponse.json({ success: false, error: 'Invalid query' }, { status: 400 })

  const { days } = parsed.data
  const admin = createAdminClient()
  const since = new Date(Date.now() - days * 86400000).toISOString()

  const [{ data: events }, { data: profile }] = await Promise.all([
    admin
      .from('learning_events')
      .select('event_type, duration_secs, payload, created_at')
      .eq('user_id', user.id)
      .gte('created_at', since)
      .order('created_at', { ascending: false }),
    admin
      .from('learner_profiles')
      .select('streak_days, next_best_action, overall_engagement_score')
      .eq('user_id', user.id)
      .maybeSingle(),
  ])

  const totalSecs = (events ?? []).reduce((sum, e) => sum + Number(e.duration_secs ?? 0), 0)
  const activeSecs = (events ?? []).reduce((sum, e) => {
    const payload = (e.payload as Record<string, unknown>) ?? {}
    const active = typeof payload.active_secs === 'number' ? payload.active_secs : e.duration_secs ?? 0
    return sum + Number(active ?? 0)
  }, 0)
  const completedModules = (events ?? []).filter((e) => e.event_type === 'module_complete').length
  const activeDayCount = new Set((events ?? []).map((e) => String(e.created_at).slice(0, 10))).size

  const focusRatio = computeFocusRatio(activeSecs, totalSecs)
  const completionVelocity = computeCompletionVelocity(completedModules, days)
  const consistencyRatio = Math.min(1, activeDayCount / days)
  const engagementScore = computeEngagementScore({ completionVelocity, focusRatio, consistencyRatio })

  return NextResponse.json({
    success: true,
    data: {
      window_days: days,
      active_learning_secs: activeSecs,
      idle_secs: Math.max(0, totalSecs - activeSecs),
      total_secs: totalSecs,
      focus_ratio: Number(focusRatio.toFixed(4)),
      completion_velocity: Number(completionVelocity.toFixed(4)),
      consistency_ratio: Number(consistencyRatio.toFixed(4)),
      engagement_score: Number(engagementScore.toFixed(4)),
      streak_days: Number(profile?.streak_days ?? 0),
      next_best_action: profile?.next_best_action ?? null,
      stored_engagement_score: Number(profile?.overall_engagement_score ?? 0),
    },
  })
}

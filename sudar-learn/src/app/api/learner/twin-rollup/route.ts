/**
 * Digital Learner Twin — roll up learning_events into learner_profiles aggregates.
 * Throttled via ai_tutor_context.last_twin_rollup_at unless force=true.
 */
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { computeTwinRollup, type LearningEventRow } from '@/lib/learner/twinRollup'

const ROLLUP_COOLDOWN_MS = 8 * 60 * 1000
const EVENT_WINDOW_DAYS = 90

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json().catch(() => ({}))
  const force = body.force === true

  const admin = createAdminClient()

  const { data: profile } = await admin
    .from('learner_profiles')
    .select('modality_scores, ai_tutor_context')
    .eq('user_id', user.id)
    .single()

  if (!profile) return NextResponse.json({ ok: true, skipped: 'no_profile' })

  const ctx = (profile.ai_tutor_context as Record<string, unknown>) ?? {}
  const lastRollup = ctx.last_twin_rollup_at as string | undefined
  if (!force && lastRollup) {
    const age = Date.now() - new Date(lastRollup).getTime()
    if (age < ROLLUP_COOLDOWN_MS) {
      return NextResponse.json({ ok: true, skipped: 'cooldown' })
    }
  }

  const since = new Date(Date.now() - EVENT_WINDOW_DAYS * 86400000).toISOString()
  const { data: events } = await admin
    .from('learning_events')
    .select('event_type, modality, duration_secs, payload, created_at')
    .eq('user_id', user.id)
    .gte('created_at', since)
    .order('created_at', { ascending: false })
    .limit(2500)

  const rollup = computeTwinRollup((events ?? []) as LearningEventRow[], profile.modality_scores as Record<string, number>)

  const nextCtx = {
    ...ctx,
    last_twin_rollup_at: new Date().toISOString(),
  }

  await admin
    .from('learner_profiles')
    .update({
      modality_scores: rollup.modality_scores,
      avg_session_duration_mins: rollup.avg_session_duration_mins,
      total_learning_minutes: rollup.total_learning_minutes,
      streak_days: rollup.streak_days,
      overall_engagement_score: rollup.overall_engagement_score,
      avg_completion_rate: rollup.avg_completion_rate,
      last_active_at: rollup.last_active_at,
      ai_tutor_context: nextCtx,
    })
    .eq('user_id', user.id)

  return NextResponse.json({ ok: true })
}

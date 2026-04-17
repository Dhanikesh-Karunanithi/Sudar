/**
 * POST /api/checkin/answer
 * Submits a check-in answer:
 * 1. Records the response
 * 2. Awards 10 SC + 10 XP
 * 3. Updates ai_tutor_context with the relevant signal
 * 4. Triggers a soft twin rollup
 * 5. Writes a learning_event for the gamification engine
 */

import { createClient, createAdminClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { evaluateGamification } from '@/lib/gamification/engine'
import { computeProfileCompleteness } from '@/lib/gamification/profileCompleteness'

const bodySchema = z.object({
  questionId: z.string().uuid(),
  answerValue: z.unknown(),
})

/** Maps signal_key to a transformer that updates ai_tutor_context. */
function applySignalToContext(
  existing: Record<string, unknown>,
  signalKey: string,
  answerValue: unknown
): Record<string, unknown> {
  const updated = { ...existing }

  switch (signalKey) {
    case 'preferred_explanation_style':
    case 'preferred_response_length':
    case 'learning_pace':
    case 'cognitive_style':
      updated[signalKey] = answerValue
      break

    case 'learning_goals':
      if (typeof answerValue === 'string') {
        const goals = (updated.learning_goals as string[]) ?? []
        if (!goals.includes(answerValue)) {
          updated.learning_goals = [...goals, answerValue].slice(-5)
        }
      }
      break

    case 'self_reported_background':
      if (typeof answerValue === 'string') {
        updated.self_reported_background = answerValue
      }
      break

    case 'difficulty_comfort':
      updated.difficulty_comfort = answerValue
      break

    case 'learning_style_notes':
      if (typeof answerValue === 'string') {
        const notes = (updated.learning_style_notes as string) ?? ''
        updated.learning_style_notes = notes ? `${notes}; ${answerValue}` : answerValue
      }
      break

    case 'session_length_preference':
      updated.session_length_preference = answerValue
      break

    case 'role_context':
      if (typeof answerValue === 'string') {
        updated.role_context = answerValue
      }
      break

    default:
      updated[signalKey] = answerValue
  }

  updated.last_updated = new Date().toISOString()
  return updated
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let body: unknown
  try { body = await request.json() } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }
  const parsed = bodySchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: 'Invalid body' }, { status: 400 })

  const { questionId, answerValue } = parsed.data
  const admin = createAdminClient()

  const { data: profile } = await admin
    .from('profiles')
    .select('org_id')
    .eq('id', user.id)
    .single()
  const hasOrg = !!profile?.org_id

  // Load question
  const { data: question } = await admin
    .from('checkin_questions')
    .select('signal_key, category')
    .eq('id', questionId)
    .single()

  if (!question) return NextResponse.json({ error: 'Question not found' }, { status: 404 })

  // Check not already answered
  const { data: existing } = await admin
    .from('checkin_responses')
    .select('id')
    .eq('user_id', user.id)
    .eq('question_id', questionId)
    .maybeSingle()

  if (existing) {
    return NextResponse.json({ error: 'Already answered', data: { alreadyAnswered: true } }, { status: 409 })
  }

  // Check daily limit
  const todayStart = new Date()
  todayStart.setHours(0, 0, 0, 0)
  const { count: todayCount } = await admin
    .from('checkin_responses')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .gte('created_at', todayStart.toISOString())

  if ((todayCount ?? 0) >= 3) {
    return NextResponse.json({ error: 'Daily limit reached' }, { status: 429 })
  }

  // Record response
  const { error: insertResponseError } = await admin.from('checkin_responses').insert({
    user_id: user.id,
    question_id: questionId,
    answer_value: answerValue,
    coin_reward: 10,
  })
  if (insertResponseError) {
    return NextResponse.json({ error: 'Failed to save response' }, { status: 500 })
  }

  // Update ai_tutor_context with signal
  const { data: lpRow } = await admin
    .from('learner_profiles')
    .select('ai_tutor_context, total_checkins_answered')
    .eq('user_id', user.id)
    .single()

  const existingContext = (lpRow?.ai_tutor_context as Record<string, unknown>) ?? {}
  const updatedContext = applySignalToContext(existingContext, question.signal_key, answerValue)

  const newCheckins = (lpRow?.total_checkins_answered ?? 0) + 1
  const profileCompleteness = computeProfileCompleteness(updatedContext, newCheckins, hasOrg)

  const { error: profileUpdateError } = await admin.from('learner_profiles').update({
    ai_tutor_context: updatedContext,
    total_checkins_answered: newCheckins,
    profile_completeness_pct: profileCompleteness,
  }).eq('user_id', user.id)
  if (profileUpdateError) {
    return NextResponse.json({ error: 'Failed to update learner profile' }, { status: 500 })
  }

  // Write learning_event for gamification engine (achievement / quest triggers).
  await admin.from('learning_events').insert({
    user_id: user.id,
    event_type: 'checkin_answered',
    payload: { question_id: questionId, signal_key: question.signal_key, total: newCheckins },
  })

  const result = await evaluateGamification({
    userId: user.id,
    eventType: 'checkin_answered',
    payload: { question_id: questionId, signal_key: question.signal_key, total: newCheckins },
    origin: request.nextUrl.origin,
    cookieHeader: request.headers.get('cookie') ?? '',
  })

  // Soft twin rollup (fire-and-forget)
  const baseUrl = request.nextUrl.origin
  fetch(`${baseUrl}/api/learner/twin-rollup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: request.headers.get('cookie') ?? '' },
    body: JSON.stringify({ force: false }),
  }).catch(() => {})

  return NextResponse.json({
    success: true,
    data: {
      coinsEarned: result.coinsEarned,
      xpEarned: result.xpEarned,
      newBalance: result.newBalance,
      totalCheckins: newCheckins,
      profileCompleteness,
      levelUp: result.levelUp,
      newAchievements: result.newAchievements,
    },
  })
}

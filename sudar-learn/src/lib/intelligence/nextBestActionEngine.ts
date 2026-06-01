/**
 * Next Best Action scoring engine (shared by dashboard route and Intelligence agent tool).
 */
import type { SupabaseClient } from '@supabase/supabase-js'
import { chatCompletion, resolveChatConfigError } from '@/lib/ai/chat'
import { buildLearnUsageChatCtx } from '@/lib/ai/learnUsageContext'
import { loadOrgAiChatContext } from '@/lib/org/orgAiChatContext'
import { gapTopicLabelsForUser } from '@/lib/learner/syncTopicSkills'
import { computeFocusRatio } from '@/types/analytics'

export interface ActivityFeatures {
  focusRatio: number
  dropOffCount: number
  completedModules: number
  quizAttempts: number
}

export interface CourseCandidate {
  id: string
  title: string
  description: string | null
  difficulty: string | null
  tags: string[]
  modules: Array<{ title: string }>
  is_external?: boolean
  external_provider?: string | null
  external_url?: string | null
}

export type NextBestActionResult =
  | { ok: true; skipped: 'no_profile' }
  | { ok: true; skipped: 'fresh'; action: Record<string, unknown> }
  | { ok: true; skipped?: undefined; action?: Record<string, unknown> }

const STALE_HOURS = 4

export async function computeNextBestActionForUser(
  admin: SupabaseClient,
  userId: string,
  options: { force?: boolean },
): Promise<NextBestActionResult> {
  const force = options.force === true
  const { orgId, orgSettings, privateRuntime } = await loadOrgAiChatContext(admin, { userId })
  const chatCfgError = resolveChatConfigError(orgSettings, privateRuntime)

  const { data: learnerProfile } = await admin
    .from('learner_profiles')
    .select('ai_tutor_context, next_best_action')
    .eq('user_id', userId)
    .single()

  if (!learnerProfile) return { ok: true, skipped: 'no_profile' }

  const memory = (learnerProfile.ai_tutor_context as Record<string, unknown>) ?? {}
  const existing = learnerProfile.next_best_action as Record<string, unknown> | null

  const since = new Date(Date.now() - 14 * 86400000).toISOString().slice(0, 10)
  const { data: activityRows } = await admin
    .from('analytics_daily_user')
    .select('active_learning_secs, total_secs, modules_completed, quiz_attempts')
    .eq('user_id', userId)
    .gte('event_date', since)

  const { data: dropOffRows } = await admin
    .from('learning_events')
    .select('id')
    .eq('user_id', userId)
    .eq('event_type', 'drop_off')
    .gte('created_at', new Date(Date.now() - 14 * 86400000).toISOString())

  const activityAgg = (activityRows ?? []).reduce(
    (acc, row) => {
      acc.activeSecs += Number(row.active_learning_secs ?? 0)
      acc.totalSecs += Number(row.total_secs ?? 0)
      acc.completedModules += Number(row.modules_completed ?? 0)
      acc.quizAttempts += Number(row.quiz_attempts ?? 0)
      return acc
    },
    { activeSecs: 0, totalSecs: 0, completedModules: 0, quizAttempts: 0 },
  )

  const features: ActivityFeatures = {
    focusRatio: computeFocusRatio(activityAgg.activeSecs, activityAgg.totalSecs),
    dropOffCount: dropOffRows?.length ?? 0,
    completedModules: activityAgg.completedModules,
    quizAttempts: activityAgg.quizAttempts,
  }

  if (!force && existing?.computed_at) {
    const ageHours = (Date.now() - new Date(existing.computed_at as string).getTime()) / 3600000
    if (ageHours < STALE_HOURS) return { ok: true, skipped: 'fresh', action: existing }
  }

  const { data: enrollments } = await admin
    .from('enrollments')
    .select('course_id, status, progress_pct')
    .eq('user_id', userId)

  const enrolledIds = new Set((enrollments ?? []).map((e) => e.course_id))

  const { data: allCourses } = await admin
    .from('courses')
    .select('id, title, description, difficulty, tags, is_external, external_provider, external_url, modules(title)')
    .eq('status', 'published')

  const candidates: CourseCandidate[] = (allCourses ?? []).filter((c) => !enrolledIds.has(c.id))
  if (candidates.length === 0) {
    await admin.from('learner_profiles').update({
      next_best_action: {
        type: 'all_enrolled',
        action_type: 'all_enrolled',
        target: {},
        recommended_duration_mins: 10,
        confidence: 0.82,
        reason: "You've enrolled in everything — great work!",
        computed_at: new Date().toISOString(),
      },
    }).eq('user_id', userId)
    return { ok: true }
  }

  const { data: peerData } = await admin
    .from('enrollments')
    .select('course_id')
    .eq('status', 'completed')
    .in('course_id', candidates.map((c) => c.id))

  const peerCounts: Record<string, number> = {}
  for (const row of peerData ?? []) {
    peerCounts[row.course_id] = (peerCounts[row.course_id] ?? 0) + 1
  }

  const knownConcepts = ((memory.known_concepts as string[]) ?? []).map((s) => s.toLowerCase())
  const gapLabels = await gapTopicLabelsForUser(admin, userId)
  const struggles = [
    ...new Set([
      ...((memory.struggles_with as string[]) ?? []).map((s) => s.toLowerCase()),
      ...gapLabels,
    ]),
  ]
  const goals = ((memory.learning_goals as string) ?? '').toLowerCase()
  const background = ((memory.self_reported_background as string) ?? '').toLowerCase()
  const preferredDifficulty = detectDifficultyFromProfile(background, memory)

  const scored = candidates.map((course) => {
    const searchText = [
      course.title,
      course.description ?? '',
      ...(course.tags ?? []),
      ...(course.modules?.map((m) => m.title) ?? []),
    ]
      .join(' ')
      .toLowerCase()

    let score = 0
    const reasons: string[] = []

    const conceptMatches = knownConcepts.filter((c) => searchText.includes(c))
    if (conceptMatches.length > 0) {
      score += Math.min(30, conceptMatches.length * 10)
      reasons.push(`builds on concepts you know (${conceptMatches.slice(0, 2).join(', ')})`)
    }

    const struggleMatches = struggles.filter((s) => searchText.includes(s))
    if (struggleMatches.length > 0) {
      score += Math.min(40, struggleMatches.length * 15)
      reasons.push(`directly addresses areas you want to improve (${struggleMatches.slice(0, 2).join(', ')})`)
    }

    if (goals) {
      const goalWords = goals.split(/\s+/).filter((w) => w.length > 4)
      const goalMatches = goalWords.filter((w) => searchText.includes(w))
      if (goalMatches.length >= 2) {
        score += 25
        reasons.push('aligns with your stated learning goals')
      }
    }

    if (course.difficulty && preferredDifficulty) {
      if (course.difficulty === preferredDifficulty) {
        score += 15
        reasons.push(`matches your level (${course.difficulty})`)
      } else if (isDifficultyAdjacent(preferredDifficulty, course.difficulty)) {
        score += 5
      }
    }

    const peers = peerCounts[course.id] ?? 0
    if (peers > 0) {
      score += Math.min(10, peers * 2)
    }

    return { course, score, reasons }
  })

  scored.sort((a, b) => b.score - a.score)
  const best = scored[0]

  if (!best || best.score === 0) {
    const fallback = candidates.reduce(
      (a, b) => ((peerCounts[a.id] ?? 0) > (peerCounts[b.id] ?? 0) ? a : b),
      candidates[0],
    )
    await admin.from('learner_profiles').update({
      next_best_action: {
        type: 'course',
        action_type: classifyActionType(features),
        target: { course_id: fallback.id },
        recommended_duration_mins: recommendedDurationMins(features),
        course_id: fallback.id,
        course_title: fallback.title,
        is_external: Boolean(fallback.is_external),
        external_provider: fallback.external_provider ?? null,
        external_url: fallback.external_url ?? null,
        reason: 'A highly-rated course in your organisation — a great next step.',
        reasons: [],
        confidence: 0.62,
        computed_at: new Date().toISOString(),
      },
    }).eq('user_id', userId)
    return { ok: true }
  }

  let reason =
    best.reasons.length > 0 ? `This course ${best.reasons[0]}.` : 'A strong next step based on your learning profile.'

  if (!chatCfgError && best.reasons.length > 0) {
    try {
      const prompt = `Write one sentence (max 25 words) explaining to a learner why they should take the course "${best.course.title}" next. Reasons: ${best.reasons.join('; ')}. Be warm and specific. No fluff.`
      const usageCtx =
        orgId != null
          ? buildLearnUsageChatCtx({
              admin,
              orgId,
              userId,
              feature: 'next_best_action',
              route: '/api/intelligence/next-action',
              privateRuntime,
            })
          : { privateOpenAi: privateRuntime }
      const { content: gen } = await chatCompletion(
        {
          messages: [{ role: 'user', content: prompt }],
          max_tokens: 60,
          temperature: 0.6,
        },
        usageCtx,
      )
      if (gen) reason = gen
    } catch {
      /* heuristic reason */
    }
  }

  const action = {
    type: 'course',
    action_type: classifyActionType(features),
    target: { course_id: best.course.id },
    recommended_duration_mins: recommendedDurationMins(features),
    course_id: best.course.id,
    course_title: best.course.title,
    course_difficulty: best.course.difficulty,
    is_external: Boolean(best.course.is_external),
    external_provider: best.course.external_provider ?? null,
    external_url: best.course.external_url ?? null,
    reason,
    confidence: confidenceFromScore(best.score, features),
    score: best.score,
    computed_at: new Date().toISOString(),
  }

  await admin.from('learner_profiles').update({ next_best_action: action }).eq('user_id', userId)
  return { ok: true, action }
}

function recommendedDurationMins(features: ActivityFeatures): number {
  if (features.focusRatio < 0.45) return 12
  if (features.dropOffCount >= 3) return 15
  if (features.completedModules >= 4) return 30
  return 20
}

function classifyActionType(features: ActivityFeatures): string {
  if (features.focusRatio < 0.45) return 'recovery_session'
  if (features.dropOffCount >= 3) return 'switch_modality'
  if (features.quizAttempts >= 4 && features.completedModules < 2) return 'retry_quiz'
  if (features.completedModules >= 3) return 'continue_module'
  return 'course'
}

function confidenceFromScore(score: number, features: ActivityFeatures): number {
  const normalized = Math.max(0.35, Math.min(0.95, score / 100))
  const stabilityBoost = features.focusRatio >= 0.6 ? 0.05 : 0
  return Math.min(0.98, Number((normalized + stabilityBoost).toFixed(3)))
}

function detectDifficultyFromProfile(background: string, memory: Record<string, unknown>): string | null {
  const comfort = memory.difficulty_comfort as string
  if (comfort) return comfort
  if (
    background.includes('senior') ||
    background.includes('expert') ||
    background.includes('lead')
  )
    return 'advanced'
  if (
    background.includes('junior') ||
    background.includes('student') ||
    background.includes('new to')
  )
    return 'beginner'
  return 'intermediate'
}

function isDifficultyAdjacent(a: string, b: string): boolean {
  const order = ['beginner', 'intermediate', 'advanced']
  return Math.abs(order.indexOf(a) - order.indexOf(b)) === 1
}

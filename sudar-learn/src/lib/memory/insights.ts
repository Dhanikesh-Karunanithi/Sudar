/**
 * Sudar — Build memory insight cards from learner data
 * Used by the Memory page and optional GET /api/memory/insights
 */

import type { Insight, InsightType } from '@/types/memory'

export interface LearnerProfileInput {
  ai_tutor_context: Record<string, unknown> | null
  next_best_action: Record<string, unknown> | null
  modality_scores?: Record<string, number> | null
  streak_days?: number
}

export interface LearningEventInput {
  event_type: string
  created_at: string
  duration_secs?: number | null
  course_id?: string | null
  payload?: Record<string, unknown> | null
}

export interface EnrollmentInput {
  course_id: string | null
  path_id?: string | null
  status: string
  progress_pct: number
  personalized_sequence?: unknown
}

export interface AiInteractionInput {
  course_id: string | null
}

const PATTERNS: string[] = [
  'pattern-1', 'pattern-2', 'pattern-3', 'pattern-4', 'pattern-5',
  'pattern-6', 'pattern-7', 'pattern-8', 'pattern-9', 'pattern-10',
]

function patternForType(type: InsightType): string {
  const i = [
    'digital_twin', 'concepts_engaged', 'areas_strengthening', 'how_you_learn',
    'preferred_modality', 'sudar_recommends', 'streak', 'progress_snapshot',
    'memory_aware_tutoring', 'course_connections', 'strength_spotlight',
    'adaptive_path', 'quiz_followup',
  ].indexOf(type)
  return PATTERNS[i % PATTERNS.length]
}

/** Compute streak from event dates (same logic as dashboard) */
function computeStreak(eventDates: string[]): number {
  if (!eventDates.length) return 0
  const days = [...new Set(eventDates.map((d) => d.slice(0, 10)))].sort().reverse()
  const today = new Date().toISOString().slice(0, 10)
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10)
  if (days[0] !== today && days[0] !== yesterday) return 0
  let streak = 1
  for (let i = 1; i < days.length; i++) {
    const prev = new Date(days[i - 1])
    const curr = new Date(days[i])
    const diff = Math.round((prev.getTime() - curr.getTime()) / 86400000)
    if (diff === 1) streak++
    else break
  }
  return streak
}

export interface BuildInsightsOptions {
  courseTitles?: Record<string, string>
  pathTitles?: Record<string, string>
}

export function buildInsights(
  profile: LearnerProfileInput | null,
  events: LearningEventInput[],
  enrollments: EnrollmentInput[],
  interactions: AiInteractionInput[],
  options: BuildInsightsOptions = {}
): Insight[] {
  const { courseTitles = {}, pathTitles = {} } = options
  const memory = (profile?.ai_tutor_context as Record<string, unknown>) ?? {}
  const insights: Insight[] = []

  const knownConcepts = (memory.known_concepts as string[]) ?? []
  const strugglesWith = (memory.struggles_with as string[]) ?? []
  const learningStyleNotes = (memory.learning_style_notes as string) ?? ''
  const interactionCount = (memory.interaction_count as number) ?? 0
  const lastUpdated = memory.last_updated as string | undefined
  const modalityPreference = memory.modality_preference as string | undefined
  const modalityScores = profile?.modality_scores as Record<string, number> | undefined
  const nba = profile?.next_best_action as Record<string, unknown> | null
  const eventDates = events.map((e) => e.created_at)
  const streakFromEvents = computeStreak(eventDates)
  const streakDays = profile?.streak_days ?? streakFromEvents

  // 1. Digital Learner Twin
  if (interactionCount > 0) {
    insights.push({
      id: 'digital_twin',
      type: 'digital_twin',
      title: 'Digital Learner Twin',
      description: `Sudar has built a profile from ${interactionCount} interaction${interactionCount !== 1 ? 's' : ''} with you. Your pace, concepts, and preferences shape every response.`,
      tag: 'Profile',
      updatedAt: lastUpdated,
      pattern: patternForType('digital_twin'),
    })
  }

  // 2. Concepts you've engaged with
  if (knownConcepts.length > 0) {
    const summary = knownConcepts.length <= 3
      ? knownConcepts.join(', ')
      : `${knownConcepts.slice(0, 2).join(', ')} and ${knownConcepts.length - 2} more`
    insights.push({
      id: 'concepts_engaged',
      type: 'concepts_engaged',
      title: "Concepts you've engaged with",
      description: `Sudar has noted topics you've worked with: ${summary}. This helps tailor explanations and connect new material.`,
      tag: 'Academic',
      updatedAt: lastUpdated,
      pattern: patternForType('concepts_engaged'),
    })
  }

  // 3. Areas Sudar is helping you strengthen
  if (strugglesWith.length > 0) {
    const summary = strugglesWith.length <= 2
      ? strugglesWith.join(' and ')
      : `${strugglesWith[0]} and ${strugglesWith.length - 1} other areas`
    insights.push({
      id: 'areas_strengthening',
      type: 'areas_strengthening',
      title: 'Areas Sudar is helping you strengthen',
      description: `Sudar is focusing on ${summary}. Keep asking questions in the tutor — it adapts to these signals.`,
      tag: 'Growth',
      updatedAt: lastUpdated,
      pattern: patternForType('areas_strengthening'),
    })
  }

  // 4. How you learn
  if (learningStyleNotes.trim()) {
    insights.push({
      id: 'how_you_learn',
      type: 'how_you_learn',
      title: 'How you learn',
      description: `Sudar adapts explanations to your style: ${learningStyleNotes.slice(0, 120)}${learningStyleNotes.length > 120 ? '…' : ''}`,
      tag: 'Style',
      updatedAt: lastUpdated,
      pattern: patternForType('how_you_learn'),
    })
  }

  // 5. Preferred way to learn (modality)
  const topModality = (() => {
    if (modalityPreference) {
      const map: Record<string, string> = {
        reading: 'reading',
        listening: 'listening',
        video: 'video',
      }
      return map[modalityPreference] || modalityPreference
    }
    if (modalityScores && typeof modalityScores === 'object') {
      const entries = Object.entries(modalityScores).filter(([, v]) => typeof v === 'number')
      if (entries.length > 0) {
        const sorted = entries.sort((a, b) => (b[1] as number) - (a[1] as number))
        return sorted[0][0]
      }
    }
    return null
  })()
  if (topModality) {
    const label = topModality.charAt(0).toUpperCase() + topModality.slice(1)
    insights.push({
      id: 'preferred_modality',
      type: 'preferred_modality',
      title: 'Preferred way to learn',
      description: `Content is tailored to your preference for ${label}. Switch modalities anytime in a course to explore.`,
      tag: 'Modality',
      pattern: patternForType('preferred_modality'),
    })
  }

  // 6. Sudar recommends (next best action)
  if (nba?.course_id && nba?.course_title) {
    const reason = (nba.reason as string) || 'A strong next step based on your learning profile.'
    insights.push({
      id: 'sudar_recommends',
      type: 'sudar_recommends',
      title: 'Sudar recommends',
      description: `${nba.course_title as string} — ${reason}`,
      tag: 'Recommendation',
      ctaLabel: 'View course',
      ctaHref: `/courses/${nba.course_id}/learn`,
      updatedAt: nba.computed_at as string | undefined,
      pattern: patternForType('sudar_recommends'),
    })
  } else if (nba?.type === 'all_enrolled' && nba?.reason) {
    insights.push({
      id: 'sudar_recommends',
      type: 'sudar_recommends',
      title: 'Sudar recommends',
      description: nba.reason as string,
      tag: 'Recommendation',
      pattern: patternForType('sudar_recommends'),
    })
  }

  // 7. Your streak
  if (streakDays > 0) {
    insights.push({
      id: 'streak',
      type: 'streak',
      title: 'Your streak',
      description: `You're on a ${streakDays}-day learning streak. Come back tomorrow to keep it going.`,
      tag: 'Motivation',
      pattern: patternForType('streak'),
    })
  }

  // 8. Progress snapshot
  const completedEnrollments = enrollments.filter((e) => e.status === 'completed')
  const inProgressEnrollments = enrollments.filter((e) => e.status === 'in_progress' || (e.progress_pct > 0 && e.status !== 'completed'))
  const totalCompletedModules = events.filter((e) => e.event_type === 'module_complete').length
  if (totalCompletedModules > 0 || completedEnrollments.length > 0 || inProgressEnrollments.length > 0) {
    const parts: string[] = []
    if (totalCompletedModules > 0) parts.push(`${totalCompletedModules} module${totalCompletedModules !== 1 ? 's' : ''} completed`)
    if (completedEnrollments.length > 0) parts.push(`${completedEnrollments.length} course${completedEnrollments.length !== 1 ? 's' : ''} done`)
    if (inProgressEnrollments.length > 0 && completedEnrollments.length === 0 && totalCompletedModules === 0)
      parts.push(`${inProgressEnrollments.length} course${inProgressEnrollments.length !== 1 ? 's' : ''} in progress`)
    if (parts.length > 0) {
      insights.push({
        id: 'progress_snapshot',
        type: 'progress_snapshot',
        title: 'Progress snapshot',
        description: `You've completed ${parts.join(' and ')}. Your progress is used to personalize what Sudar suggests next.`,
        tag: 'Progress',
        ctaLabel: 'My progress',
        ctaHref: '/progress',
        pattern: patternForType('progress_snapshot'),
      })
    }
  }

  // 9. Memory-aware tutoring (conceptual — always show if we have any memory)
  if (interactionCount > 0 || knownConcepts.length > 0 || strugglesWith.length > 0) {
    insights.push({
      id: 'memory_aware_tutoring',
      type: 'memory_aware_tutoring',
      title: 'Memory-aware tutoring',
      description: 'Sudar uses your history to suggest when to review and how to explain things. Spaced repetition and your patterns drive personalised follow-ups.',
      tag: 'How Sudar works',
      pattern: patternForType('memory_aware_tutoring'),
    })
  }

  // 10. Course connections (from ai_interactions)
  const courseIdsFromInteractions = [...new Set(interactions.map((i) => i.course_id).filter(Boolean))] as string[]
  if (courseIdsFromInteractions.length > 0) {
    const names = courseIdsFromInteractions
      .slice(0, 3)
      .map((id) => courseTitles[id] || 'a course')
    const list = names.length <= 2 ? names.join(' and ') : `${names[0]}, ${names[1]} and ${names[2]}`
    const firstId = courseIdsFromInteractions[0]
    insights.push({
      id: 'course_connections',
      type: 'course_connections',
      title: 'Course connections',
      description: `You've asked Sudar about topics in ${list}. Your questions in the tutor are linked to your courses.`,
      tag: 'Courses',
      ctaLabel: firstId ? 'Open course' : undefined,
      ctaHref: firstId ? `/courses/${firstId}/learn` : undefined,
      pattern: patternForType('course_connections'),
    })
  }

  // 11. Strength spotlight (known_concepts + completed courses)
  if (knownConcepts.length >= 2 || completedEnrollments.length > 0) {
    const strengthParts: string[] = []
    if (knownConcepts.length >= 2)
      strengthParts.push(knownConcepts.slice(0, 2).join(', '))
    if (completedEnrollments.length > 0)
      strengthParts.push(`${completedEnrollments.length} course${completedEnrollments.length !== 1 ? 's' : ''} completed`)
    insights.push({
      id: 'strength_spotlight',
      type: 'strength_spotlight',
      title: 'Strength spotlight',
      description: strengthParts.length > 0
        ? `Emerging strengths: ${strengthParts.join('; ')}. Sudar uses these to recommend what to learn next.`
        : 'Sudar highlights your progress to build confidence and guide you toward mastery.',
      tag: 'Growth',
      ctaLabel: 'Browse courses',
      ctaHref: '/courses',
      pattern: patternForType('strength_spotlight'),
    })
  }

  // 12. Adaptive path (if personalized_sequence exists on any enrollment)
  const hasPersonalizedPath = enrollments.some((e) =>
    Array.isArray(e.personalized_sequence) && e.personalized_sequence.length > 0
  )
  if (hasPersonalizedPath) {
    const pathEnrollment = enrollments.find((e) => e.path_id)
    const pathIdVal = pathEnrollment?.path_id
    insights.push({
      id: 'adaptive_path',
      type: 'adaptive_path',
      title: 'Adaptive path',
      description: 'Your learning path order is personalized by Sudar based on your profile and progress.',
      tag: 'Paths',
      ctaLabel: pathIdVal ? 'View path' : undefined,
      ctaHref: pathIdVal ? `/paths/${pathIdVal}` : undefined,
      pattern: patternForType('adaptive_path'),
    })
  }

  // 13. Quiz follow-up (recent quiz_attempt with wrong_topics)
  const recentQuiz = events.find((e) => e.event_type === 'quiz_attempt')
  const quizPayload = recentQuiz?.payload as { wrong_topics?: string[] } | undefined
  if (recentQuiz && quizPayload?.wrong_topics?.length) {
    insights.push({
      id: 'quiz_followup',
      type: 'quiz_followup',
      title: 'Topics to review',
      description: `Sudar has noted topics from your last quiz to review: ${quizPayload.wrong_topics.slice(0, 3).join(', ')}${quizPayload.wrong_topics.length > 3 ? ' and more' : ''}. Ask the tutor for help on any of these.`,
      tag: 'Academic',
      updatedAt: recentQuiz.created_at,
      pattern: patternForType('quiz_followup'),
    })
  }

  // Add pattern to any insight that doesn't have one
  for (const insight of insights) {
    if (!insight.pattern) insight.pattern = patternForType(insight.type)
  }

  return insights
}

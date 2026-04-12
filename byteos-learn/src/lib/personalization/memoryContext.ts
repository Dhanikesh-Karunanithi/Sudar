/**
 * Shared learner context for course welcome and module overlays — aligned with tutor memory.
 * Keeps prompt assembly and privacy-safe disclosure keys in one place.
 */

import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'

export const PERSONALIZATION_SIGNALS = [
  'learning_goals',
  'known_concepts',
  'struggles_with',
  'self_reported_background',
  'preferred_explanation_style',
  'preferred_response_length',
  'learning_style_notes',
  'interaction_count',
  'modality_scores',
  'cognitive_style',
  'learning_pace',
  'difficulty_comfort',
  'course_quiz_review_topics',
  'course_progress_modules',
  /** Set when prior enrollments are passed into course welcome */
  'prior_courses_history',
  /** Set when known concepts align with this course's titles/description */
  'course_knowledge_bridge',
] as const

export type PersonalizationSignal = (typeof PERSONALIZATION_SIGNALS)[number]

export interface PersonalizationMemoryBundle {
  /** Full learner + profile block for LLM prompts */
  learnerProfileBlock: string
  /** Activity in this course (quizzes, completions) */
  courseActivityBlock: string
  /** Which signal categories had usable data (for analytics + UI disclosure) */
  signalsUsed: PersonalizationSignal[]
  /** Denormalized for course welcome concept bridge */
  knownConceptsList: string[]
  /** True when preferred style or response length is set (for prompt hints) */
  explanationPreferencesActive: boolean
}

export function pushSignal(
  signals: PersonalizationSignal[],
  key: PersonalizationSignal,
  condition: boolean
) {
  if (condition && !signals.includes(key)) signals.push(key)
}

/** Merge course-welcome-only signals after enroll-bridge computes prior courses / concept bridge. */
export function mergeCourseWelcomeSignals(
  base: PersonalizationSignal[],
  opts: { priorCourseRows: number; relevantConceptCount: number }
): PersonalizationSignal[] {
  const out = [...base]
  pushSignal(out, 'prior_courses_history', opts.priorCourseRows > 0)
  pushSignal(out, 'course_knowledge_bridge', opts.relevantConceptCount > 0)
  return out
}

function formatModalityScores(raw: unknown): string {
  if (raw == null || (typeof raw === 'object' && Object.keys(raw as object).length === 0)) {
    return ''
  }
  try {
    return typeof raw === 'string' ? raw : JSON.stringify(raw)
  } catch {
    return ''
  }
}

export async function loadPersonalizationMemoryForCourse(
  admin: SupabaseClient<Database>,
  params: { userId: string; courseId: string }
): Promise<PersonalizationMemoryBundle> {
  const { userId, courseId } = params
  const signalsUsed: PersonalizationSignal[] = []

  const { data: lp } = await admin
    .from('learner_profiles')
    .select(
      'ai_tutor_context, modality_scores, cognitive_style, learning_pace, difficulty_comfort'
    )
    .eq('user_id', userId)
    .single()

  const memory = (lp?.ai_tutor_context as Record<string, unknown>) ?? {}

  const knownRaw = (memory.known_concepts as string[] | undefined) ?? []
  const strugglesRaw = (memory.struggles_with as string[] | undefined) ?? []
  const goals = (memory.learning_goals as string) ?? ''
  const background = (memory.self_reported_background as string) ?? ''
  const preferredStyle = (memory.preferred_explanation_style as string) ?? ''
  const preferredLength = (memory.preferred_response_length as string) ?? ''
  const learningStyleNotes = (memory.learning_style_notes as string) ?? ''
  const interactionCount = memory.interaction_count

  pushSignal(signalsUsed, 'learning_goals', goals.trim().length > 0)
  pushSignal(signalsUsed, 'known_concepts', knownRaw.length > 0)
  pushSignal(signalsUsed, 'struggles_with', strugglesRaw.length > 0)
  pushSignal(signalsUsed, 'self_reported_background', background.trim().length > 0)
  pushSignal(signalsUsed, 'preferred_explanation_style', preferredStyle.trim().length > 0)
  pushSignal(signalsUsed, 'preferred_response_length', preferredLength.trim().length > 0)
  pushSignal(signalsUsed, 'learning_style_notes', learningStyleNotes.trim().length > 0)
  pushSignal(
    signalsUsed,
    'interaction_count',
    typeof interactionCount === 'number' && interactionCount > 0
  )

  const modalityStr = formatModalityScores(lp?.modality_scores)
  pushSignal(signalsUsed, 'modality_scores', modalityStr.length > 0)

  const cognitive = (lp?.cognitive_style as string) ?? ''
  const pace = (lp?.learning_pace as string) ?? ''
  const difficultyComfort = (lp?.difficulty_comfort as string) ?? ''
  pushSignal(signalsUsed, 'cognitive_style', cognitive.trim().length > 0)
  pushSignal(signalsUsed, 'learning_pace', pace.trim().length > 0)
  pushSignal(signalsUsed, 'difficulty_comfort', difficultyComfort.trim().length > 0)

  const learnerProfileBlock = `What Sudar knows about this learner:
- Known concepts: ${knownRaw.length ? knownRaw.join(', ') : 'none yet'}
- Struggles with: ${strugglesRaw.length ? strugglesRaw.join(', ') : 'none identified'}
- Learning style notes: ${learningStyleNotes || 'not yet observed'}
- Self-reported background: ${background || 'not provided'}
- Learning goals: ${goals || 'not stated'}
- Preferred explanation style: ${preferredStyle || 'not set'}
- Preferred response length: ${preferredLength || 'not set'}
- Total interactions with Sudar: ${typeof interactionCount === 'number' ? interactionCount : 0}
${modalityStr ? `- Modality engagement (JSON): ${modalityStr}` : ''}
${cognitive ? `- Cognitive style: ${cognitive}` : ''}
${pace ? `- Learning pace: ${pace}` : ''}
${difficultyComfort ? `- Difficulty comfort: ${difficultyComfort}` : ''}`

  const { data: courseEvents } = await admin
    .from('learning_events')
    .select('event_type, payload, module_id, created_at')
    .eq('user_id', userId)
    .eq('course_id', courseId)
    .in('event_type', ['quiz_attempt', 'module_complete'])
    .order('created_at', { ascending: false })
    .limit(25)

  const wrongTopics = new Set<string>()
  let moduleCompleteCount = 0
  for (const ev of courseEvents ?? []) {
    if (ev.event_type === 'module_complete') {
      moduleCompleteCount += 1
      continue
    }
    if (ev.event_type === 'quiz_attempt' && ev.payload && typeof ev.payload === 'object') {
      const wt = (ev.payload as { wrong_topics?: string[] }).wrong_topics
      if (Array.isArray(wt)) {
        for (const t of wt) {
          if (typeof t === 'string' && t.trim()) wrongTopics.add(t.trim())
        }
      }
    }
  }

  pushSignal(signalsUsed, 'course_quiz_review_topics', wrongTopics.size > 0)
  pushSignal(signalsUsed, 'course_progress_modules', moduleCompleteCount > 0)

  const quizLine =
    wrongTopics.size > 0
      ? `Topics marked for extra review from recent quizzes in this course: ${[...wrongTopics].slice(0, 8).join(', ')}${wrongTopics.size > 8 ? '…' : ''}`
      : 'No recent quiz wrong-topic data in this course yet.'

  const progressLine =
    moduleCompleteCount > 0
      ? `Sections completed in this course so far: ${moduleCompleteCount} module(s).`
      : 'No module completions recorded in this course yet.'

  const courseActivityBlock = `In this course lately:
${quizLine}
${progressLine}`

  const explanationPreferencesActive =
    preferredStyle.trim().length > 0 || preferredLength.trim().length > 0

  return {
    learnerProfileBlock,
    courseActivityBlock,
    signalsUsed,
    knownConceptsList: [...knownRaw],
    explanationPreferencesActive,
  }
}

const DISCLOSURE_LABELS: Record<PersonalizationSignal, string> = {
  learning_goals: 'your learning goals',
  known_concepts: 'topics you already know',
  struggles_with: 'topics you find harder',
  self_reported_background: 'your background',
  preferred_explanation_style: 'your preferred explanation style',
  preferred_response_length: 'your preferred answer length',
  learning_style_notes: 'how you learn best',
  interaction_count: 'your activity with Sudar',
  modality_scores: 'how you use learning formats',
  cognitive_style: 'your cognitive style',
  learning_pace: 'your learning pace',
  difficulty_comfort: 'comfort with difficulty',
  course_quiz_review_topics: 'recent quiz focus areas in this course',
  course_progress_modules: 'progress in this course',
  prior_courses_history: 'your other courses on Sudar',
  course_knowledge_bridge: 'overlap between what you know and this course',
}

/** Short learner-facing sentence listing what influenced personalization (no raw PII). */
export function formatPersonalizationDisclosure(signals: PersonalizationSignal[], maxLabels = 8): string {
  if (signals.length === 0) return ''
  const labels = signals.map((s) => DISCLOSURE_LABELS[s] ?? s)
  const capped = labels.slice(0, maxLabels)
  const extra = labels.length > maxLabels ? `, and ${labels.length - maxLabels} more signal${labels.length - maxLabels === 1 ? '' : 's'}` : ''
  if (capped.length === 1) return `Personalization used ${capped[0]}${extra}.`
  if (capped.length === 2) return `Personalization used ${capped[0]} and ${capped[1]}${extra}.`
  const head = capped.slice(0, -1).join(', ')
  return `Personalization used ${head}, and ${capped[capped.length - 1]}${extra}.`
}

export type AnalyticsRiskLevel = 'low' | 'medium' | 'high'

export type NextBestActionType =
  | 'continue_module'
  | 'switch_modality'
  | 'review_flashcards'
  | 'retry_quiz'
  | 'recovery_session'
  | 'course'
  | 'all_enrolled'

export interface NextBestActionInsight {
  action_type: NextBestActionType
  target: {
    course_id?: string
    module_id?: string
    modality?: string
  }
  recommended_duration_mins: number
  reason: string
  confidence: number
  computed_at: string
}

export interface LearnerInsightSnapshot {
  active_learning_secs: number
  idle_secs: number
  total_secs: number
  focus_ratio: number
  completion_velocity: number
  engagement_score: number
  streak_days: number
}

export const ANALYTICS_WEIGHTS = {
  engagement: {
    completionVelocity: 0.4,
    focusRatio: 0.35,
    consistency: 0.25,
  },
  risk: {
    dropOff: 0.35,
    lowFocus: 0.35,
    noCompletions: 0.3,
  },
} as const

export function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value))
}

export function computeFocusRatio(activeSecs: number, totalSecs: number): number {
  if (totalSecs <= 0) return 0
  return clamp01(activeSecs / totalSecs)
}

export function computeCompletionVelocity(completedModules: number, windowDays: number): number {
  if (windowDays <= 0) return 0
  return Math.max(0, completedModules / windowDays)
}

export function computeEngagementScore(input: {
  completionVelocity: number
  focusRatio: number
  consistencyRatio: number
}): number {
  const score =
    input.completionVelocity * ANALYTICS_WEIGHTS.engagement.completionVelocity +
    input.focusRatio * ANALYTICS_WEIGHTS.engagement.focusRatio +
    input.consistencyRatio * ANALYTICS_WEIGHTS.engagement.consistency
  return clamp01(score)
}

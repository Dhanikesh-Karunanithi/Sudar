/**
 * Sudar — Memory Insights (carousel cards)
 * Used by the Memory page to show what Sudar has learned about the learner.
 */

export type InsightType =
  | 'digital_twin'
  | 'concepts_engaged'
  | 'areas_strengthening'
  | 'how_you_learn'
  | 'preferred_modality'
  | 'sudar_recommends'
  | 'streak'
  | 'progress_snapshot'
  | 'memory_aware_tutoring'
  | 'course_connections'
  | 'strength_spotlight'
  | 'adaptive_path'
  | 'quiz_followup'

export interface Insight {
  id: string
  type: InsightType
  title: string
  description: string
  tag: string
  ctaLabel?: string
  ctaHref?: string
  updatedAt?: string
  /** CSS class for card pattern (e.g. pattern-1 through pattern-10) */
  pattern?: string
}

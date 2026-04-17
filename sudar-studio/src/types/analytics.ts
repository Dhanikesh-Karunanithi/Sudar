export type AnalyticsRiskLevel = 'low' | 'medium' | 'high'

export interface AnalyticsOverviewResponse {
  success: boolean
  data?: {
    active_learners: number
    active_learning_secs: number
    idle_secs: number
    total_secs: number
    completion_count: number
    drop_off_count: number
    avg_engagement_score: number
    focus_ratio: number
  }
  error?: string
}

export interface LearnerRiskRow {
  user_id: string
  full_name: string
  risk_score: number
  risk_level: AnalyticsRiskLevel
  reasons: string[]
  focus_ratio_7d: number | null
  completion_velocity_7d: number | null
  drop_off_count_7d: number
  last_active_at: string | null
}

export type NotificationCategory =
  | 'course_assigned'
  | 'path_assigned'
  | 'mission_daily'
  | 'mission_streak_risk'
  | 'coin_drop'
  | 'level_up'
  | 'checkin_today'
  | 'tutor_proactive'
  | 'compliance_overdue'
  | 'org_announcement'
  | 'creator_campaign'
  | 'achievement'
  | 'quest'
  | 'level'
  | 'course'
  | 'path'
  | 'system'
  | 'streak'
  | 'checkin'

export interface UserNotificationRow {
  id: string
  user_id?: string
  category: string
  title: string
  body: string | null
  link_url: string | null
  metadata: Record<string, unknown>
  read_at: string | null
  created_at: string
}

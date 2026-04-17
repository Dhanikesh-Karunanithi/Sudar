export type NotificationCategory =
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

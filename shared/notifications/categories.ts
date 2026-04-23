export const NOTIFICATION_CHANNELS = ['in_app', 'web_push', 'os_foreground', 'email'] as const

export type NotificationChannel = (typeof NOTIFICATION_CHANNELS)[number]

export const NOTIFICATION_CATEGORIES = [
  'course_assigned',
  'path_assigned',
  'mission_daily',
  'mission_streak_risk',
  'coin_drop',
  'achievement',
  'level_up',
  'leaderboard',
  'checkin_today',
  'course_generated',
  'tutor_proactive',
  'compliance_overdue',
  'org_announcement',
  'creator_campaign',
  'system',
] as const

export type NotificationCategorySlug = (typeof NOTIFICATION_CATEGORIES)[number]

export interface NotificationCategoryConfig {
  slug: NotificationCategorySlug
  title: string
  defaultChannels: NotificationChannel[]
  mandatoryForOrgs: boolean
  rateCapPerDay: number
  allowQuietHours: boolean
}

export const NOTIFICATION_CATEGORY_CONFIG: Record<NotificationCategorySlug, NotificationCategoryConfig> = {
  course_assigned: { slug: 'course_assigned', title: 'Course assigned', defaultChannels: ['in_app', 'email'], mandatoryForOrgs: true, rateCapPerDay: 2, allowQuietHours: false },
  path_assigned: { slug: 'path_assigned', title: 'Path assigned', defaultChannels: ['in_app', 'email'], mandatoryForOrgs: true, rateCapPerDay: 2, allowQuietHours: false },
  mission_daily: { slug: 'mission_daily', title: 'Daily mission', defaultChannels: ['in_app', 'web_push'], mandatoryForOrgs: false, rateCapPerDay: 1, allowQuietHours: true },
  mission_streak_risk: { slug: 'mission_streak_risk', title: 'Streak risk', defaultChannels: ['in_app', 'web_push', 'email'], mandatoryForOrgs: false, rateCapPerDay: 2, allowQuietHours: true },
  coin_drop: { slug: 'coin_drop', title: 'Coin opportunity', defaultChannels: ['in_app', 'web_push'], mandatoryForOrgs: false, rateCapPerDay: 2, allowQuietHours: true },
  achievement: { slug: 'achievement', title: 'Achievement', defaultChannels: ['in_app', 'web_push'], mandatoryForOrgs: false, rateCapPerDay: 4, allowQuietHours: true },
  level_up: { slug: 'level_up', title: 'Level up', defaultChannels: ['in_app', 'web_push'], mandatoryForOrgs: false, rateCapPerDay: 2, allowQuietHours: true },
  leaderboard: { slug: 'leaderboard', title: 'Leaderboard', defaultChannels: ['in_app', 'web_push'], mandatoryForOrgs: false, rateCapPerDay: 2, allowQuietHours: true },
  checkin_today: { slug: 'checkin_today', title: 'Check-in', defaultChannels: ['in_app', 'web_push'], mandatoryForOrgs: false, rateCapPerDay: 1, allowQuietHours: true },
  course_generated: { slug: 'course_generated', title: 'Course generated', defaultChannels: ['in_app', 'os_foreground'], mandatoryForOrgs: false, rateCapPerDay: 3, allowQuietHours: false },
  tutor_proactive: { slug: 'tutor_proactive', title: 'Sudar nudge', defaultChannels: ['in_app', 'web_push'], mandatoryForOrgs: false, rateCapPerDay: 2, allowQuietHours: true },
  compliance_overdue: { slug: 'compliance_overdue', title: 'Compliance', defaultChannels: ['in_app', 'email'], mandatoryForOrgs: true, rateCapPerDay: 3, allowQuietHours: false },
  org_announcement: { slug: 'org_announcement', title: 'Announcement', defaultChannels: ['in_app', 'email'], mandatoryForOrgs: false, rateCapPerDay: 2, allowQuietHours: true },
  creator_campaign: { slug: 'creator_campaign', title: 'Creator campaign', defaultChannels: ['in_app', 'web_push', 'email'], mandatoryForOrgs: false, rateCapPerDay: 3, allowQuietHours: true },
  system: { slug: 'system', title: 'System update', defaultChannels: ['in_app', 'email'], mandatoryForOrgs: true, rateCapPerDay: 5, allowQuietHours: false },
}

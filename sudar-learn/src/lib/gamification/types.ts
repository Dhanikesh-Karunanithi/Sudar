/** Shared gamification types used across engine, API routes, and UI. */

export type AchievementRarity = 'common' | 'rare' | 'epic' | 'legendary'
export type QuestType = 'daily' | 'weekly' | 'story' | 'org'
export type QuestStatus = 'active' | 'completed' | 'expired'
export type RewardCategory = 'ai_powerup' | 'cosmetic' | 'feature'
export type CoinEventType =
  | 'module_complete'
  | 'course_complete'
  | 'streak_milestone_hit'
  | 'quiz_mastery'
  | 'ai_tutor_session'
  | 'checkin_answered'
  | 'profile_question_answered'
  | 'modality_explorer_bonus'
  | 'course_reflection_submitted'
  | 'peer_challenge_won'
  | 'org_kpi_milestone'
  | 'creator_course_published'
  | 'creator_milestone_hit'
  | 'onboarding_step_complete'
  | 'achievement_unlocked'
  | 'quest_completed'
  | 'level_up'
  | 'manager_gift'

export interface GamificationResult {
  coinsEarned: number
  xpEarned: number
  levelUp: { from: number; to: number; newTitle: string } | null
  newAchievements: Array<{ slug: string; title: string; rarity: AchievementRarity; coinReward: number; xpReward: number }>
  newBalance: number
  newXp: number
  newLevel: number
}

export interface CoinEarnRule {
  eventType: string
  coins: number
  xp: number
  dailyLimit?: number
  /** predicate receiving the event payload to determine if rule applies */
  condition?: (payload: Record<string, unknown>, context: EarnContext) => boolean
}

export interface EarnContext {
  userId: string
  courseId?: string | null
  moduleId?: string | null
  payload: Record<string, unknown>
  streakDays?: number
}

export const SCHOLAR_RANKS: Array<{ level: number; title: string; xpRequired: number; levelUpCoins: number }> = [
  { level: 1,  title: 'Seeker',         xpRequired: 0,       levelUpCoins: 0   },
  { level: 2,  title: 'Apprentice',     xpRequired: 500,     levelUpCoins: 25  },
  { level: 3,  title: 'Scholar',        xpRequired: 1500,    levelUpCoins: 25  },
  { level: 4,  title: 'Practitioner',   xpRequired: 3500,    levelUpCoins: 25  },
  { level: 5,  title: 'Adept',          xpRequired: 7500,    levelUpCoins: 50  },
  { level: 6,  title: 'Expert',         xpRequired: 15000,   levelUpCoins: 50  },
  { level: 7,  title: 'Mentor',         xpRequired: 30000,   levelUpCoins: 50  },
  { level: 8,  title: 'Sage',           xpRequired: 55000,   levelUpCoins: 100 },
  { level: 9,  title: 'Architect',      xpRequired: 90000,   levelUpCoins: 100 },
  { level: 10, title: 'Luminary',       xpRequired: 140000,  levelUpCoins: 100 },
  { level: 11, title: 'Oracle',         xpRequired: 200000,  levelUpCoins: 200 },
  { level: 12, title: 'Grand Explorer', xpRequired: 300000,  levelUpCoins: 200 },
]

export function getLevelForXp(xp: number): { level: number; title: string } {
  let current = SCHOLAR_RANKS[0]!
  for (const rank of SCHOLAR_RANKS) {
    if (xp >= rank.xpRequired) current = rank
    else break
  }
  return { level: current.level, title: current.title }
}

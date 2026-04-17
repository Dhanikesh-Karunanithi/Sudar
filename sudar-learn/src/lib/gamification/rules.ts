/** Coin and XP earn rules — deterministic lookup table by event_type. */

import type { CoinEarnRule } from './types'

export const COIN_EARN_RULES: CoinEarnRule[] = [
  {
    eventType: 'module_complete',
    coins: 25,
    xp: 40,
  },
  {
    eventType: 'course_complete',
    coins: 100,
    xp: 200,
  },
  {
    eventType: 'quiz_attempt',
    coins: 30,
    xp: 60,
    condition: (payload) => payload.score === 100 && payload.first_attempt === true,
  },
  {
    eventType: 'quiz_attempt',
    coins: 0,
    xp: 20,
    condition: (payload) => typeof payload.score === 'number' && (payload.score as number) >= 70 && payload.score !== 100,
  },
  {
    eventType: 'ai_tutor_query',
    coins: 5,
    xp: 10,
    dailyLimit: 10,
  },
  {
    eventType: 'checkin_answered',
    coins: 10,
    xp: 10,
    dailyLimit: 3,
  },
  {
    eventType: 'profile_question_answered',
    coins: 10,
    xp: 15,
  },
  {
    eventType: 'modality_explorer_bonus',
    coins: 75,
    xp: 0,
  },
  {
    eventType: 'course_reflection_submitted',
    coins: 20,
    xp: 0,
  },
  {
    eventType: 'onboarding_step_complete',
    coins: 15,
    xp: 25,
  },
  {
    eventType: 'streak_milestone_hit',
    coins: 0, // dynamic — set by engine based on streak value in payload
    xp: 0,
  },
  {
    eventType: 'creator_course_published',
    coins: 200,
    xp: 150,
  },
  {
    eventType: 'creator_milestone_hit',
    coins: 100,
    xp: 100,
  },
  {
    eventType: 'org_kpi_milestone',
    coins: 0, // admin-configured — engine reads payload.coins
    xp: 50,
  },
]

/** Dynamic streak milestone coin rewards. */
export const STREAK_MILESTONE_COINS: Record<number, { coins: number; xp: number }> = {
  7:  { coins: 50,   xp: 75   },
  14: { coins: 100,  xp: 150  },
  30: { coins: 250,  xp: 300  },
  60: { coins: 500,  xp: 600  },
  90: { coins: 1000, xp: 1000 },
}

/** Look up the rule for an event type (first matching). */
export function findRule(eventType: string, payload: Record<string, unknown>): CoinEarnRule | null {
  for (const rule of COIN_EARN_RULES) {
    if (rule.eventType !== eventType) continue
    if (rule.condition && !rule.condition(payload, { userId: '', payload })) continue
    return rule
  }
  return null
}

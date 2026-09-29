/**
 * Per-user daily usage limits for AI calls.
 * Uses atomic RPC increment_usage_request_count; returns 429 when over limit.
 * Fails closed when the RPC is unavailable (prevents unbounded spend).
 * Requires admin client (service role).
 */

const TUTOR_DAILY_LIMIT = 500
const NEXT_ACTION_DAILY_LIMIT = 200
const GENERIC_AI_DAILY_LIMIT = 300
const MODULE_PERSONALIZE_DAILY_LIMIT = 120

export type LimitType = 'tutor' | 'next_action' | 'generic' | 'module_personalize'

const LIMITS: Record<LimitType, number> = {
  tutor: TUTOR_DAILY_LIMIT,
  next_action: NEXT_ACTION_DAILY_LIMIT,
  generic: GENERIC_AI_DAILY_LIMIT,
  module_personalize: MODULE_PERSONALIZE_DAILY_LIMIT,
}

import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'

export type UsageCheckResult =
  | { allowed: true }
  | { allowed: false; limit: number; reason?: 'over_limit' | 'metering_unavailable' }

export async function checkAndIncrementUsage(
  admin: Pick<SupabaseClient<Database>, 'rpc'>,
  userId: string,
  type: LimitType
): Promise<UsageCheckResult> {
  const limit = LIMITS[type]
  const today = new Date().toISOString().slice(0, 10)

  const { data: newCount, error } = await admin.rpc('increment_usage_request_count', {
    p_user_id: userId,
    p_date: today,
  })

  if (error || newCount == null) {
    return { allowed: false, limit, reason: 'metering_unavailable' }
  }
  if (newCount > limit) return { allowed: false, limit, reason: 'over_limit' }
  return { allowed: true }
}

export function usageLimitErrorResponse(usage: Extract<UsageCheckResult, { allowed: false }>) {
  if (usage.reason === 'metering_unavailable') {
    return {
      status: 503 as const,
      body: { error: 'Usage metering temporarily unavailable. Please try again shortly.' },
    }
  }
  return {
    status: 429 as const,
    body: { error: `Daily AI limit (${usage.limit}) reached. Try again tomorrow.` },
  }
}

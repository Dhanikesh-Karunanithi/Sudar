/**
 * Per-user daily usage limits for Studio AI generation.
 * Shares Supabase RPC increment_usage_request_count with Learn.
 * Fails closed in production when metering is unavailable (spend protection);
 * fails open in development so a local DB without the RPC still works.
 */

import type { SupabaseClient } from '@supabase/supabase-js'

const STUDIO_GENERATE_DAILY_LIMIT = 200

export type StudioUsageCheckResult =
  | { allowed: true }
  | { allowed: false; limit: number; reason?: 'over_limit' | 'metering_unavailable' }

export async function checkAndIncrementStudioUsage(
  admin: Pick<SupabaseClient, 'rpc'>,
  userId: string,
): Promise<StudioUsageCheckResult> {
  const today = new Date().toISOString().slice(0, 10)
  const { data: newCount, error } = await admin.rpc('increment_usage_request_count', {
    p_user_id: userId,
    p_date: today,
  })

  if (error || newCount == null) {
    if (process.env.NODE_ENV !== 'production') {
      console.warn('[usage-limits] metering unavailable; allowing in development', error?.message)
      return { allowed: true }
    }
    return { allowed: false, limit: STUDIO_GENERATE_DAILY_LIMIT, reason: 'metering_unavailable' }
  }
  if (Number(newCount) > STUDIO_GENERATE_DAILY_LIMIT) {
    return { allowed: false, limit: STUDIO_GENERATE_DAILY_LIMIT, reason: 'over_limit' }
  }
  return { allowed: true }
}

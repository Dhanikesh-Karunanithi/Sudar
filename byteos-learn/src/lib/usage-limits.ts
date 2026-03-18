/**
 * Per-user daily usage limits for AI calls.
 * Uses atomic RPC increment_usage_request_count; returns 429 when over limit.
 * Requires admin client (service role).
 */

const TUTOR_DAILY_LIMIT = 500
const NEXT_ACTION_DAILY_LIMIT = 200
const GENERIC_AI_DAILY_LIMIT = 300

export type LimitType = 'tutor' | 'next_action' | 'generic'

const LIMITS: Record<LimitType, number> = {
  tutor: TUTOR_DAILY_LIMIT,
  next_action: NEXT_ACTION_DAILY_LIMIT,
  generic: GENERIC_AI_DAILY_LIMIT,
}

type SupabaseAdmin = {
  rpc: (fn: string, params: { p_user_id: string; p_date: string }) => Promise<{ data: number | null; error: unknown }>
}

export async function checkAndIncrementUsage(
  admin: SupabaseAdmin,
  userId: string,
  type: LimitType
): Promise<{ allowed: true } | { allowed: false; limit: number }> {
  const limit = LIMITS[type]
  const today = new Date().toISOString().slice(0, 10)

  const { data: newCount, error } = await admin.rpc('increment_usage_request_count', {
    p_user_id: userId,
    p_date: today,
  })

  if (error || newCount == null) return { allowed: true }
  if (newCount > limit) return { allowed: false, limit }
  return { allowed: true }
}

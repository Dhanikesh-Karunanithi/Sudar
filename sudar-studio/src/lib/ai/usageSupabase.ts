import type { createServiceRoleSupabaseClient } from '@/lib/supabase/server'

/** Supabase client for AI usage tables until generated Database types include them. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type AiUsageSupabase = any

export function aiUsageDb(admin: ReturnType<typeof createServiceRoleSupabaseClient>): AiUsageSupabase {
  return admin as AiUsageSupabase
}

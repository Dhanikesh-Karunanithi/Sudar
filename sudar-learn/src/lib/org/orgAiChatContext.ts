import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'
import { buildPrivateOpenAiRuntime, type PrivateOpenAiRuntime } from '@/types/orgAiInference'

export type OrgAiChatContext = {
  orgSettings: unknown
  privateRuntime: PrivateOpenAiRuntime | null
}

/**
 * Resolve organisation settings and private OpenAI-compatible runtime for chat.
 * Prefers course org when courseId is set; otherwise profile.org_id.
 */
export async function loadOrgAiChatContext(
  admin: SupabaseClient<Database>,
  opts: { courseId?: string | null; userId: string }
): Promise<OrgAiChatContext> {
  let orgId: string | null = null
  if (opts.courseId) {
    const { data } = await admin.from('courses').select('org_id').eq('id', opts.courseId).maybeSingle()
    orgId = data?.org_id ?? null
  }
  if (!orgId) {
    const { data } = await admin.from('profiles').select('org_id').eq('id', opts.userId).maybeSingle()
    orgId = data?.org_id ?? null
  }
  if (!orgId) {
    return { orgSettings: {}, privateRuntime: null }
  }
  const { data: org } = await admin.from('organisations').select('settings').eq('id', orgId).maybeSingle()
  const settings = org?.settings ?? {}
  return {
    orgSettings: settings,
    privateRuntime: buildPrivateOpenAiRuntime(settings),
  }
}

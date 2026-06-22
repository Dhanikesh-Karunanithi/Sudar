import type { ChatCompletionContext } from '@/lib/ai/chat'
import { buildLearnUsageChatCtx } from '@/lib/ai/learnUsageContext'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { AiUsageFeature, AiUsageMetadata } from '../../../../shared/ai/usageTypes'
import type { Database } from '@/types/database'
import { buildPrivateOpenAiRuntime, type PrivateOpenAiRuntime } from '@/types/orgAiInference'

export type OrgAiChatContext = {
  orgId: string | null
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
    const { data: profile } = await admin
      .from('profiles')
      .select('org_id, active_org_id')
      .eq('id', opts.userId)
      .maybeSingle()
    const preferred = profile?.active_org_id ?? profile?.org_id ?? null
    if (preferred) {
      const { data: member } = await admin
        .from('org_members')
        .select('org_id')
        .eq('user_id', opts.userId)
        .eq('org_id', preferred)
        .maybeSingle()
      orgId = member?.org_id ?? preferred
    }
    if (!orgId) {
      const { data: membership } = await admin
        .from('org_members')
        .select('org_id')
        .eq('user_id', opts.userId)
        .order('joined_at', { ascending: true })
        .limit(1)
        .maybeSingle()
      orgId = membership?.org_id ?? null
    }
  }
  if (!orgId) {
    return { orgId: null, orgSettings: {}, privateRuntime: null }
  }
  const { data: org } = await admin.from('organisations').select('settings').eq('id', orgId).maybeSingle()
  const settings = org?.settings ?? {}
  return {
    orgId,
    orgSettings: settings,
    privateRuntime: buildPrivateOpenAiRuntime(settings),
  }
}

export function learnMeteringChatCtx(
  admin: SupabaseClient<Database>,
  orgId: string,
  userId: string,
  orgSettings: unknown,
  privateRuntime: PrivateOpenAiRuntime | null,
  feature: AiUsageFeature,
  route: string,
  metadata?: AiUsageMetadata
): ChatCompletionContext {
  return buildLearnUsageChatCtx({
    admin: admin as unknown as NonNullable<ChatCompletionContext['usageAdmin']>,
    orgId,
    userId,
    feature,
    route,
    metadata,
    privateRuntime,
    orgSettings,
  })
}

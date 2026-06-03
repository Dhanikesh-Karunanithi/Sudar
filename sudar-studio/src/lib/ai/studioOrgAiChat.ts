import type { SupabaseClient } from '@supabase/supabase-js'
import type { ChatCompletionContext } from '@/lib/ai/chat'
import { orgSettingsToAiChatContext, type OrgAiChatContext } from '@/lib/ai/orgAiChatContext'
import { buildStudioUsageChatCtx } from '@/lib/ai/studioUsageContext'
import type { AiUsageFeature, AiUsageMetadata } from '../../../../shared/ai/usageTypes'
import type { Database } from '@/types/database'

type AdminClient = SupabaseClient<Database>

export async function fetchStudioOrgAiContext(admin: AdminClient, orgId: string): Promise<OrgAiChatContext> {
  const { data: org } = await admin.from('organisations').select('settings').eq('id', orgId).single()
  return orgSettingsToAiChatContext(org?.settings)
}

/** Standard metering context for Studio AI routes. */
export function studioMeteringChatCtx(
  admin: AdminClient,
  orgId: string,
  userId: string,
  orgSettings: unknown,
  privateRuntime: OrgAiChatContext['privateRuntime'],
  feature: AiUsageFeature,
  route: string,
  metadata?: AiUsageMetadata
): ChatCompletionContext {
  return buildStudioUsageChatCtx({
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

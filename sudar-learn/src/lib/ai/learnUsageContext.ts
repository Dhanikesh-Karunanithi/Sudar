import type { ChatCompletionContext } from '@/lib/ai/chat'
import type { AiUsageCallKind, AiUsageFeature, AiUsageMetadata } from '../../../../shared/ai/usageTypes'
import type { PrivateOpenAiRuntime } from '@/types/orgAiInference'

type UsageAdmin = NonNullable<ChatCompletionContext['usageAdmin']>

export function buildLearnUsageChatCtx(opts: {
  admin: UsageAdmin
  orgId: string
  userId: string
  feature: AiUsageFeature
  route: string
  callKind?: AiUsageCallKind
  metadata?: AiUsageMetadata
  privateRuntime?: PrivateOpenAiRuntime | null
  orgSettings?: unknown
}): ChatCompletionContext {
  return {
    privateOpenAi: opts.privateRuntime ?? null,
    usageAdmin: opts.admin,
    orgSettings: opts.orgSettings,
    usageContext: {
      orgId: opts.orgId,
      userId: opts.userId,
      surface: 'learn',
      feature: opts.feature,
      callKind: opts.callKind ?? 'main',
      route: opts.route,
      metadata: opts.metadata,
    },
  }
}

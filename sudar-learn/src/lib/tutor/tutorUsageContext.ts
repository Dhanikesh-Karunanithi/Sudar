import type { ChatCompletionContext } from '@/lib/ai/chat'
import type { AiUsageCallKind, AiUsageMetadata } from '../../../../shared/ai/usageTypes'
import type { PrivateOpenAiRuntime } from '@/types/orgAiInference'

type UsageAdmin = NonNullable<ChatCompletionContext['usageAdmin']>

export type TutorMeteringDeps = {
  orgId: string | null
  userId: string
  usageAdmin: UsageAdmin | null
  usageMetadata?: AiUsageMetadata
  orgSettings?: unknown
}

export function buildTutorUsageChatCtx(
  deps: TutorMeteringDeps & { privateRuntime: PrivateOpenAiRuntime | null },
  callKind: AiUsageCallKind
): ChatCompletionContext {
  const base: ChatCompletionContext = {
    privateOpenAi: deps.privateRuntime,
  }
  if (!deps.orgId || !deps.usageAdmin) return base
  return {
    ...base,
    usageAdmin: deps.usageAdmin,
    orgSettings: deps.orgSettings,
    usageContext: {
      orgId: deps.orgId,
      userId: deps.userId,
      surface: 'learn',
      feature: 'tutor_chat',
      callKind,
      route: '/api/tutor/query',
      metadata: deps.usageMetadata,
    },
  }
}

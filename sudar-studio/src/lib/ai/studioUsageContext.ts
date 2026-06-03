import type { ChatCompletionContext } from '@/lib/ai/chat'
import type { AiUsageCallKind, AiUsageFeature, AiUsageMetadata } from '../../../../shared/ai/usageTypes'
import type { PrivateOpenAiRuntime } from '@/types/orgAiInference'

type UsageAdmin = NonNullable<ChatCompletionContext['usageAdmin']>

export type StudioUsageDeps = {
  admin: UsageAdmin
  orgId: string
  userId: string
  feature: AiUsageFeature
  route: string
  metadata?: AiUsageMetadata
  privateRuntime?: PrivateOpenAiRuntime | null
  orgSettings?: unknown
}

export function buildStudioUsageChatCtx(
  deps: StudioUsageDeps,
  callKind: AiUsageCallKind = 'main'
): ChatCompletionContext {
  return {
    privateOpenAi: deps.privateRuntime ?? null,
    usageAdmin: deps.admin,
    orgSettings: deps.orgSettings,
    usageContext: {
      orgId: deps.orgId,
      userId: deps.userId,
      surface: 'studio',
      feature: deps.feature,
      callKind,
      route: deps.route,
      metadata: deps.metadata,
    },
  }
}

/** Merge call_kind into an existing chat context (e.g. pipeline multi-step). */
export function withUsageCallKind(
  ctx: ChatCompletionContext | undefined,
  callKind: AiUsageCallKind
): ChatCompletionContext | undefined {
  if (!ctx?.usageContext) return ctx
  return {
    ...ctx,
    usageContext: { ...ctx.usageContext, callKind },
  }
}

export function withUsageMetadata(
  ctx: ChatCompletionContext,
  metadata: AiUsageMetadata
): ChatCompletionContext {
  if (!ctx.usageContext) return ctx
  return {
    ...ctx,
    usageContext: {
      ...ctx.usageContext,
      metadata: { ...ctx.usageContext.metadata, ...metadata },
    },
  }
}

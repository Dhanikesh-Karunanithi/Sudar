/**
 * Sudar Learn — provider-agnostic chat completion.
 * Supports org private server, Sudar AI (FreeLLMAPI), and cloud fallback chain.
 */

import { assertOrgAiQuota } from '../../../../shared/ai/checkOrgAiQuota'
import {
  chatWithPlatformOrCloudFallback,
  getCloudChatConfigError,
  getOrgPlatformAiConfigError,
} from '../../../../shared/ai/platformChat'
import { parseOpenAiCompatibleUsage } from '../../../../shared/ai/parseChatUsage'
import type { AiUsageContext, ChatUsage } from '../../../../shared/ai/usageTypes'
import { getOrgPrivateAiConfigError, type PrivateOpenAiRuntime } from '@/types/orgAiInference'
import { recordAiUsage, type RecordAiUsageInput, type UsageAdmin } from '@/lib/ai/recordUsage'
import { buildPlatformAiRuntime, parseOrgAiPlatform } from '../../../../shared/ai/orgAiPlatform'

export type ChatMessage = { role: 'system' | 'user' | 'assistant'; content: string }

export type ChatCompletionContext = {
  privateOpenAi?: PrivateOpenAiRuntime | null
  usageContext?: AiUsageContext
  usageAdmin?: UsageAdmin
  orgSettings?: unknown
}

export type ChatCompletionOptions = {
  messages: ChatMessage[]
  model?: string
  max_tokens?: number
  temperature?: number
  top_p?: number
}

export type ChatCompletionResult = {
  content: string
  provider: string
  model: string
  usage?: ChatUsage
}

const DEFAULT_TUTOR_MODEL = 'openai/gpt-oss-20b'
const DEFAULT_MEMORY_MODEL = 'google/gemma-3n-E4B-it'

async function chatPrivateOpenAi(
  runtime: PrivateOpenAiRuntime,
  options: ChatCompletionOptions
): Promise<ChatCompletionResult> {
  const base = runtime.baseUrl.replace(/\/$/, '')
  const url = `${base}/v1/chat/completions`
  const model = options.model ?? runtime.defaultModel ?? getDefaultModel('custom')
  const res = await fetch(url, {
    method: 'POST',
    headers: { Authorization: `Bearer ${runtime.apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model,
      messages: options.messages,
      max_tokens: options.max_tokens ?? 1024,
      temperature: options.temperature ?? 0.7,
      ...(options.top_p != null && { top_p: options.top_p }),
    }),
  })
  const text = await res.text()
  if (!res.ok) throw new Error(text || `AI API ${res.status}`)
  const data = JSON.parse(text)
  const content = data.choices?.[0]?.message?.content?.trim() ?? ''
  const usage = parseOpenAiCompatibleUsage(data.usage)
  return { content, provider: 'custom', model, usage }
}

function getDefaultModel(provider: string): string {
  return (
    process.env.AI_CHAT_DEFAULT_MODEL?.trim() ||
    (provider === 'together' ? (process.env.TOGETHER_TUTOR_MODEL?.trim() || DEFAULT_TUTOR_MODEL) : null) ||
    DEFAULT_TUTOR_MODEL
  )
}

export function getDefaultTutorModel(
  privateRuntime?: PrivateOpenAiRuntime | null,
  orgSettings?: unknown
): string {
  if (privateRuntime) return privateRuntime.defaultModel
  const platform = buildPlatformAiRuntime(orgSettings ?? {})
  if (platform) return platform.defaultModel
  return process.env.AI_CHAT_DEFAULT_MODEL?.trim() || process.env.TOGETHER_TUTOR_MODEL?.trim() || DEFAULT_TUTOR_MODEL
}

export function getDefaultMemoryModel(
  privateRuntime?: PrivateOpenAiRuntime | null,
  orgSettings?: unknown
): string {
  if (privateRuntime) return privateRuntime.defaultModel
  const platform = parseOrgAiPlatform(orgSettings ?? {})
  if (platform.enabled) return platform.model
  return process.env.TOGETHER_MEMORY_MODEL?.trim() || DEFAULT_MEMORY_MODEL
}

function maybeRecordUsage(ctx: ChatCompletionContext | undefined, result: ChatCompletionResult): void {
  if (!ctx?.usageContext || !ctx.usageAdmin || !result.usage) return
  const input: RecordAiUsageInput = {
    ...ctx.usageContext,
    provider: result.provider,
    model: result.model,
    usage: result.usage,
    metadata: {
      ...ctx.usageContext.metadata,
      private_runtime: Boolean(ctx.privateOpenAi),
    },
  }
  recordAiUsage(ctx.usageAdmin, input)
}

export async function chatCompletion(
  options: ChatCompletionOptions,
  ctx?: ChatCompletionContext
): Promise<ChatCompletionResult> {
  if (ctx?.usageContext?.orgId && ctx.usageAdmin && ctx.orgSettings) {
    await assertOrgAiQuota(ctx.usageAdmin, ctx.usageContext.orgId, ctx.orgSettings)
  }

  let result: ChatCompletionResult
  const p = ctx?.privateOpenAi
  if (p) {
    result = await chatPrivateOpenAi(p, options)
  } else {
    result = await chatWithPlatformOrCloudFallback(options, ctx?.orgSettings)
  }
  maybeRecordUsage(ctx, result)
  return result
}

export function resolveChatConfigError(orgSettings: unknown, privateRuntime: PrivateOpenAiRuntime | null): string | null {
  if (privateRuntime) return null
  const orgErr = getOrgPrivateAiConfigError(orgSettings)
  if (orgErr) return orgErr
  const platformErr = getOrgPlatformAiConfigError(orgSettings)
  if (platformErr) return platformErr
  return getCloudChatConfigError()
}

export function getChatConfigError(): string | null {
  return getCloudChatConfigError()
}

export type { ChatUsage, AiUsageContext }

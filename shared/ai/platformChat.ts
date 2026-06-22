/**
 * Shared Sudar AI platform (FreeLLMAPI) + cloud fallback routing for chat completions.
 */

import type { ChatUsage } from './usageTypes'
import { parseAnthropicUsage, parseOpenAiCompatibleUsage } from './parseChatUsage'
import {
  buildPlatformAiRuntime,
  getOrgPlatformAiConfigError,
  SUDAR_PLATFORM_PROVIDER_ID,
  type PlatformAiRuntime,
} from './orgAiPlatform'

export type PlatformChatMessage = { role: 'system' | 'user' | 'assistant'; content: string }

export type PlatformChatOptions = {
  messages: PlatformChatMessage[]
  model?: string
  max_tokens?: number
  temperature?: number
  top_p?: number
  response_format?: { type: 'json_object' }
}

export type PlatformChatResult = {
  content: string
  provider: string
  model: string
  usage?: ChatUsage
}

const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions'
const TOGETHER_URL = 'https://api.together.xyz/v1/chat/completions'
const OPENAI_URL = 'https://api.openai.com/v1/chat/completions'
const ANTHROPIC_URL = 'https://api.anthropic.com/v1/messages'

const DEFAULT_MODEL_BY_PROVIDER: Record<string, string> = {
  openrouter: 'openai/gpt-4o-mini',
  together: 'meta-llama/Llama-3.3-70B-Instruct-Turbo',
  openai: 'gpt-4o-mini',
  anthropic: 'claude-3-5-sonnet-20241022',
  custom: 'gemma3:4b',
  [SUDAR_PLATFORM_PROVIDER_ID]: 'auto',
}

const CLOUD_PROVIDER_ORDER = ['openrouter', 'together', 'openai', 'anthropic'] as const

function getConfiguredCloudProviders(): string[] {
  const preferred = process.env.AI_CHAT_PROVIDER?.trim().toLowerCase()
  if (preferred && CLOUD_PROVIDER_ORDER.includes(preferred as (typeof CLOUD_PROVIDER_ORDER)[number])) {
    return [preferred, ...CLOUD_PROVIDER_ORDER.filter((p) => p !== preferred)]
  }
  return CLOUD_PROVIDER_ORDER.filter((provider) => {
    if (provider === 'openrouter') return Boolean(process.env.OPENROUTER_API_KEY?.trim())
    if (provider === 'together') return Boolean(process.env.TOGETHER_API_KEY?.trim())
    if (provider === 'openai') return Boolean(process.env.OPENAI_API_KEY?.trim())
    if (provider === 'anthropic') return Boolean(process.env.ANTHROPIC_API_KEY?.trim())
    return false
  })
}

function getApiKeyAndUrl(provider: string): { key: string; url: string } {
  const customBase = process.env.AI_CHAT_BASE_URL?.replace(/\/$/, '')
  switch (provider) {
    case 'openrouter': {
      const key = process.env.OPENROUTER_API_KEY?.trim()
      if (!key) throw new Error('OPENROUTER_API_KEY not set')
      return { key, url: OPENROUTER_URL }
    }
    case 'together': {
      const key = process.env.TOGETHER_API_KEY?.trim()
      if (!key) throw new Error('TOGETHER_API_KEY not set')
      return { key, url: TOGETHER_URL }
    }
    case 'openai': {
      const key = process.env.OPENAI_API_KEY?.trim()
      if (!key) throw new Error('OPENAI_API_KEY not set')
      return { key, url: OPENAI_URL }
    }
    case 'anthropic': {
      const key = process.env.ANTHROPIC_API_KEY?.trim()
      if (!key) throw new Error('ANTHROPIC_API_KEY not set')
      return { key, url: ANTHROPIC_URL }
    }
    case 'custom': {
      if (!customBase) throw new Error('AI_CHAT_BASE_URL not set for custom provider')
      const key =
        process.env.AI_CHAT_API_KEY?.trim() ||
        process.env.OPENAI_API_KEY?.trim() ||
        process.env.TOGETHER_API_KEY?.trim()
      if (!key) throw new Error('Set AI_CHAT_API_KEY or OPENAI_API_KEY or TOGETHER_API_KEY for custom provider')
      return { key, url: `${customBase}/v1/chat/completions` }
    }
    default:
      throw new Error(`Unknown provider: ${provider}`)
  }
}

function resolveModel(provider: string, options: PlatformChatOptions, override?: string): string {
  return (
    options.model ??
    override ??
    process.env.AI_CHAT_DEFAULT_MODEL?.trim() ??
    DEFAULT_MODEL_BY_PROVIDER[provider] ??
    DEFAULT_MODEL_BY_PROVIDER.together
  )
}

async function chatOpenAICompatible(
  url: string,
  apiKey: string,
  options: PlatformChatOptions,
  provider: string,
  modelOverride?: string
): Promise<PlatformChatResult> {
  const model = resolveModel(provider, options, modelOverride)
  const res = await fetch(url, {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model,
      messages: options.messages,
      max_tokens: options.max_tokens ?? 1024,
      temperature: options.temperature ?? 0.7,
      ...(options.top_p != null && { top_p: options.top_p }),
      ...(options.response_format && { response_format: options.response_format }),
    }),
  })
  const text = await res.text()
  if (!res.ok) throw new Error(text || `AI API ${res.status}`)
  const data = JSON.parse(text)
  const content = data.choices?.[0]?.message?.content?.trim() ?? ''
  const usage = parseOpenAiCompatibleUsage(data.usage)
  return { content, provider, model, usage }
}

async function chatAnthropic(apiKey: string, options: PlatformChatOptions): Promise<PlatformChatResult> {
  const model = resolveModel('anthropic', options)
  const system = options.messages.find((m) => m.role === 'system')?.content
  const rest = options.messages.filter((m) => m.role !== 'system') as Array<{
    role: 'user' | 'assistant'
    content: string
  }>
  if (!rest.some((m) => m.role === 'user')) throw new Error('No user message')
  const res = await fetch(ANTHROPIC_URL, {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      max_tokens: options.max_tokens ?? 1024,
      ...(system && { system }),
      messages: rest,
    }),
  })
  const text = await res.text()
  if (!res.ok) throw new Error(text || `Anthropic API ${res.status}`)
  const data = JSON.parse(text)
  const content = data.content?.[0]?.text?.trim() ?? ''
  const usage = parseAnthropicUsage(data.usage)
  return { content, provider: 'anthropic', model, usage }
}

async function chatWithPlatformRuntime(
  runtime: PlatformAiRuntime,
  options: PlatformChatOptions
): Promise<PlatformChatResult> {
  const base = runtime.baseUrl.replace(/\/$/, '')
  const url = base.endsWith('/chat/completions') ? base : `${base}/chat/completions`
  const model = options.model ?? runtime.defaultModel
  return chatOpenAICompatible(url, runtime.apiKey, options, SUDAR_PLATFORM_PROVIDER_ID, model)
}

async function chatWithCloudProvider(
  provider: string,
  options: PlatformChatOptions
): Promise<PlatformChatResult> {
  const { key, url } = getApiKeyAndUrl(provider)
  if (provider === 'anthropic') return chatAnthropic(key, options)
  return chatOpenAICompatible(url, key, options, provider)
}

export async function chatWithPlatformOrCloudFallback(
  options: PlatformChatOptions,
  orgSettings?: unknown
): Promise<PlatformChatResult> {
  const platformErr = getOrgPlatformAiConfigError(orgSettings ?? {})
  if (platformErr) throw new Error(platformErr)

  const platform = buildPlatformAiRuntime(orgSettings ?? {})
  if (platform) {
    try {
      return await chatWithPlatformRuntime(platform, options)
    } catch {
      // fall through to cloud chain
    }
  }

  const providers = getConfiguredCloudProviders()
  if (providers.length === 0) {
    if (process.env.AI_CHAT_BASE_URL?.trim()) {
      return chatWithCloudProvider('custom', options)
    }
    throw new Error('No AI chat provider configured.')
  }

  let lastError: Error | null = null
  for (const provider of providers) {
    try {
      return await chatWithCloudProvider(provider, options)
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err))
    }
  }
  throw lastError ?? new Error('All AI providers failed.')
}

export function getCloudChatConfigError(): string | null {
  const providers = getConfiguredCloudProviders()
  if (providers.length > 0) return null
  if (process.env.AI_CHAT_BASE_URL?.trim()) {
    const key =
      process.env.AI_CHAT_API_KEY?.trim() ||
      process.env.OPENAI_API_KEY?.trim() ||
      process.env.TOGETHER_API_KEY?.trim()
    if (!key) {
      return 'Set AI_CHAT_API_KEY (any non-empty string is fine for Ollama) or reuse OPENAI_API_KEY / TOGETHER_API_KEY.'
    }
    return null
  }
  return 'No AI chat provider configured. Set a cloud API key or enable Sudar AI for your organisation.'
}

export { getOrgPlatformAiConfigError, buildPlatformAiRuntime, SUDAR_PLATFORM_PROVIDER_ID }

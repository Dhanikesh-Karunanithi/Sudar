/**
 * Sudar Studio — provider-agnostic chat completion.
 * Supports OpenRouter, Together, OpenAI, Anthropic, and custom base URL.
 * Set AI_CHAT_PROVIDER or rely on fallback: first available key in order above.
 */

export type ChatMessage = { role: 'system' | 'user' | 'assistant'; content: string }

export type ChatCompletionOptions = {
  messages: ChatMessage[]
  model?: string
  max_tokens?: number
  temperature?: number
  top_p?: number
}

export type ChatCompletionResult = { content: string; provider: string }

const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions'
const TOGETHER_URL = 'https://api.together.xyz/v1/chat/completions'
const OPENAI_URL = 'https://api.openai.com/v1/chat/completions'
const ANTHROPIC_URL = 'https://api.anthropic.com/v1/messages'

const DEFAULT_MODEL_BY_PROVIDER: Record<string, string> = {
  openrouter: 'openai/gpt-4o-mini',
  together: 'meta-llama/Llama-3.3-70B-Instruct-Turbo',
  openai: 'gpt-4o-mini',
  anthropic: 'claude-3-5-sonnet-20241022',
}

function getProvider(): string {
  const env = process.env.AI_CHAT_PROVIDER?.trim().toLowerCase()
  if (env && ['openrouter', 'together', 'openai', 'anthropic', 'custom'].includes(env)) return env
  if (process.env.OPENROUTER_API_KEY?.trim()) return 'openrouter'
  if (process.env.TOGETHER_API_KEY?.trim()) return 'together'
  if (process.env.OPENAI_API_KEY?.trim()) return 'openai'
  if (process.env.ANTHROPIC_API_KEY?.trim()) return 'anthropic'
  if (process.env.AI_CHAT_BASE_URL?.trim()) return 'custom'
  return 'together'
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
      const key = process.env.AI_CHAT_API_KEY?.trim() || process.env.OPENAI_API_KEY?.trim() || process.env.TOGETHER_API_KEY?.trim()
      if (!key) throw new Error('Set AI_CHAT_API_KEY or OPENAI_API_KEY or TOGETHER_API_KEY for custom provider')
      return { key, url: `${customBase}/v1/chat/completions` }
    }
    default:
      throw new Error(`Unknown AI_CHAT_PROVIDER: ${provider}`)
  }
}

/** OpenAI-compatible request (OpenRouter, Together, OpenAI, custom). */
async function chatOpenAICompatible(
  url: string,
  apiKey: string,
  options: ChatCompletionOptions,
  provider: string
): Promise<ChatCompletionResult> {
  const model = options.model ?? process.env.AI_CHAT_DEFAULT_MODEL?.trim() ?? DEFAULT_MODEL_BY_PROVIDER[provider] ?? DEFAULT_MODEL_BY_PROVIDER.together
  const res = await fetch(url, {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
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
  return { content, provider }
}

/** Anthropic Messages API — map messages to Anthropic format (system + user/assistant only). */
async function chatAnthropic(apiKey: string, options: ChatCompletionOptions): Promise<ChatCompletionResult> {
  const model = options.model ?? process.env.AI_CHAT_DEFAULT_MODEL?.trim() ?? DEFAULT_MODEL_BY_PROVIDER.anthropic
  const system = options.messages.find((m) => m.role === 'system')?.content
  const rest = options.messages.filter((m) => m.role !== 'system') as Array<{ role: 'user' | 'assistant'; content: string }>
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
  return { content, provider: 'anthropic' }
}

/**
 * Call the configured AI chat provider. Throws if no provider is configured.
 */
export async function chatCompletion(
  options: ChatCompletionOptions
): Promise<ChatCompletionResult> {
  const provider = getProvider()
  const { key, url } = getApiKeyAndUrl(provider)
  if (provider === 'anthropic') return chatAnthropic(key, options)
  return chatOpenAICompatible(url, key, options, provider)
}

/**
 * Returns a user-friendly error message when no AI provider is configured.
 */
export function getChatConfigError(): string | null {
  const provider = process.env.AI_CHAT_PROVIDER?.trim()?.toLowerCase()
  if (provider === 'openrouter' && !process.env.OPENROUTER_API_KEY?.trim()) return 'Set OPENROUTER_API_KEY in .env.local or host environment.'
  if (provider === 'together' && !process.env.TOGETHER_API_KEY?.trim()) return 'Set TOGETHER_API_KEY in .env.local or host environment.'
  if (provider === 'openai' && !process.env.OPENAI_API_KEY?.trim()) return 'Set OPENAI_API_KEY in .env.local or host environment.'
  if (provider === 'anthropic' && !process.env.ANTHROPIC_API_KEY?.trim()) return 'Set ANTHROPIC_API_KEY in .env.local or host environment.'
  if (provider === 'custom' && !process.env.AI_CHAT_BASE_URL?.trim()) return 'Set AI_CHAT_BASE_URL for custom provider.'
  if (!process.env.OPENROUTER_API_KEY?.trim() && !process.env.TOGETHER_API_KEY?.trim() && !process.env.OPENAI_API_KEY?.trim() && !process.env.ANTHROPIC_API_KEY?.trim()) {
    return 'No AI chat provider configured. Set AI_CHAT_PROVIDER and one of OPENROUTER_API_KEY, TOGETHER_API_KEY, OPENAI_API_KEY, or ANTHROPIC_API_KEY. See docs/ENV_REFERENCE.md.'
  }
  return null
}

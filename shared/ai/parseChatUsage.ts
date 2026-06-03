import type { ChatUsage } from './usageTypes'

/** Parse OpenAI-compatible chat/completions usage block. */
export function parseOpenAiCompatibleUsage(raw: unknown): ChatUsage | undefined {
  if (!raw || typeof raw !== 'object') return undefined
  const u = raw as Record<string, unknown>
  const prompt = num(u.prompt_tokens)
  const completion = num(u.completion_tokens)
  if (prompt == null && completion == null) return undefined
  const cached =
    num((u.prompt_tokens_details as Record<string, unknown> | undefined)?.cached_tokens) ??
    num(u.cached_tokens) ??
    0
  const total =
    num(u.total_tokens) ??
    (prompt ?? 0) + (completion ?? 0)
  return {
    prompt_tokens: prompt ?? 0,
    completion_tokens: completion ?? 0,
    cached_tokens: cached,
    total_tokens: total,
  }
}

/** Parse Anthropic Messages API usage block. */
export function parseAnthropicUsage(raw: unknown): ChatUsage | undefined {
  if (!raw || typeof raw !== 'object') return undefined
  const u = raw as Record<string, unknown>
  const input = num(u.input_tokens)
  const output = num(u.output_tokens)
  if (input == null && output == null) return undefined
  const cacheRead = num(u.cache_read_input_tokens) ?? 0
  const cacheCreate = num(u.cache_creation_input_tokens) ?? 0
  const prompt = (input ?? 0) + cacheCreate
  const completion = output ?? 0
  return {
    prompt_tokens: prompt,
    completion_tokens: completion,
    cached_tokens: cacheRead,
    total_tokens: prompt + completion,
  }
}

function num(v: unknown): number | undefined {
  if (typeof v === 'number' && Number.isFinite(v)) return v
  return undefined
}

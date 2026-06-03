import type { ChatUsage } from './usageTypes'

export type ModelPricingRow = {
  provider: string
  model: string
  price_per_1m_input: number
  price_per_1m_output: number
}

/**
 * Estimate marginal USD cost from token usage and a pricing row.
 * Cached input tokens billed at 50% of input price when provider reports them.
 */
export function estimateLlmCostUsd(
  usage: ChatUsage,
  pricing: ModelPricingRow | null | undefined
): number | null {
  if (!pricing) return null
  const cached = usage.cached_tokens ?? 0
  const billableInput = Math.max(0, usage.prompt_tokens - cached) + cached * 0.5
  const inputCost = (billableInput / 1_000_000) * pricing.price_per_1m_input
  const outputCost = (usage.completion_tokens / 1_000_000) * pricing.price_per_1m_output
  return Number((inputCost + outputCost).toFixed(8))
}

/** Rough embed cost when provider does not return token counts (chars / 4). */
export function estimateEmbeddingTokensFromText(text: string): number {
  return Math.ceil(text.length / 4)
}

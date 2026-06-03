/**
 * Fire-and-forget AI usage ledger writes (Studio).
 */
import { estimateLlmCostUsd, type ModelPricingRow } from '../../../../shared/ai/estimateCost'
import type {
  AiUsageCallKind,
  AiUsageContext,
  AiUsageMetadata,
  AiUsageUnitType,
  ChatUsage,
} from '../../../../shared/ai/usageTypes'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type UsageAdmin = any

const pricingCache = new Map<string, { at: number; row: ModelPricingRow | null }>()
const PRICING_TTL_MS = 5 * 60 * 1000

async function loadPricing(
  admin: UsageAdmin,
  provider: string,
  model: string
): Promise<ModelPricingRow | null> {
  const key = `${provider}:${model}`
  const hit = pricingCache.get(key)
  if (hit && Date.now() - hit.at < PRICING_TTL_MS) return hit.row

  const today = new Date().toISOString().slice(0, 10)
  const { data } = await admin
    .from('ai_model_pricing')
    .select('provider, model, price_per_1m_input, price_per_1m_output')
    .eq('provider', provider)
    .eq('model', model)
    .lte('effective_from', today)
    .order('effective_from', { ascending: false })
    .limit(1)

  const row = data?.[0]
    ? {
        provider: data[0].provider,
        model: data[0].model,
        price_per_1m_input: Number(data[0].price_per_1m_input),
        price_per_1m_output: Number(data[0].price_per_1m_output),
      }
    : null
  pricingCache.set(key, { at: Date.now(), row })
  return row
}

export type RecordAiUsageInput = AiUsageContext & {
  provider: string
  model: string
  usage?: ChatUsage
  unitType?: AiUsageUnitType
  units?: number
}

export function recordAiUsage(admin: UsageAdmin, input: RecordAiUsageInput): void {
  void recordAiUsageAsync(admin, input).catch(() => {
    /* metering must not break admin UX */
  })
}

async function recordAiUsageAsync(admin: UsageAdmin, input: RecordAiUsageInput): Promise<void> {
  const unitType = input.unitType ?? 'llm_tokens'
  const usage = input.usage
  const pricing =
    unitType === 'llm_tokens' && usage
      ? await loadPricing(admin, input.provider, input.model)
      : null
  const estimatedCost =
    unitType === 'llm_tokens' && usage ? estimateLlmCostUsd(usage, pricing) : null

  const row = {
    org_id: input.orgId,
    user_id: input.userId ?? null,
    surface: input.surface,
    feature: input.feature,
    call_kind: input.callKind ?? 'main',
    route: input.route ?? null,
    provider: input.provider,
    model: input.model,
    unit_type: unitType,
    prompt_tokens: usage?.prompt_tokens ?? null,
    completion_tokens: usage?.completion_tokens ?? null,
    cached_tokens: usage?.cached_tokens ?? 0,
    total_tokens: usage?.total_tokens ?? null,
    units: input.units ?? null,
    estimated_cost_usd: estimatedCost,
    metadata: (input.metadata ?? {}) as AiUsageMetadata,
  }

  await admin.from('ai_usage_events').insert(row)
}

export function recordAiUnits(
  admin: UsageAdmin,
  input: Omit<RecordAiUsageInput, 'usage'> & { unitType: AiUsageUnitType; units: number }
): void {
  recordAiUsage(admin, { ...input, usage: undefined })
}

export type { AiUsageCallKind, AiUsageContext, ChatUsage }

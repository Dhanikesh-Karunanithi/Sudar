/** Shared date-range parsing for org AI usage APIs. */
export function parseUsageDateRange(searchParams: URLSearchParams): {
  from: string
  to: string
} {
  const today = new Date()
  const defaultTo = today.toISOString().slice(0, 10)
  const fromDefault = new Date(today)
  fromDefault.setUTCDate(fromDefault.getUTCDate() - 30)
  const from = searchParams.get('from')?.slice(0, 10) ?? fromDefault.toISOString().slice(0, 10)
  const to = searchParams.get('to')?.slice(0, 10) ?? defaultTo
  return { from, to }
}

export type FeatureBreakdownRow = {
  feature: string
  request_count: number
  prompt_tokens: number
  completion_tokens: number
  total_tokens: number
  estimated_cost_usd: number
}

export function aggregateRollupRows(
  rows: Array<{
    feature: string
    request_count: number
    prompt_tokens: number | string
    completion_tokens: number | string
    total_tokens: number | string
    estimated_cost_usd: number | string
  }>
): {
  totals: FeatureBreakdownRow
  by_feature: FeatureBreakdownRow[]
} {
  const byFeatureMap = new Map<string, FeatureBreakdownRow>()

  for (const row of rows) {
    const existing = byFeatureMap.get(row.feature) ?? {
      feature: row.feature,
      request_count: 0,
      prompt_tokens: 0,
      completion_tokens: 0,
      total_tokens: 0,
      estimated_cost_usd: 0,
    }
    existing.request_count += row.request_count ?? 0
    existing.prompt_tokens += Number(row.prompt_tokens) || 0
    existing.completion_tokens += Number(row.completion_tokens) || 0
    existing.total_tokens += Number(row.total_tokens) || 0
    existing.estimated_cost_usd += Number(row.estimated_cost_usd) || 0
    byFeatureMap.set(row.feature, existing)
  }

  const by_feature = [...byFeatureMap.values()].sort((a, b) => b.total_tokens - a.total_tokens)
  const totals = by_feature.reduce<FeatureBreakdownRow>(
    (acc, row) => ({
      feature: '_total',
      request_count: acc.request_count + row.request_count,
      prompt_tokens: acc.prompt_tokens + row.prompt_tokens,
      completion_tokens: acc.completion_tokens + row.completion_tokens,
      total_tokens: acc.total_tokens + row.total_tokens,
      estimated_cost_usd: acc.estimated_cost_usd + row.estimated_cost_usd,
    }),
    {
      feature: '_total',
      request_count: 0,
      prompt_tokens: 0,
      completion_tokens: 0,
      total_tokens: 0,
      estimated_cost_usd: 0,
    }
  )

  return { totals, by_feature }
}

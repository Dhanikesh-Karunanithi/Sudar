import { OrgAiQuotaExceededError, parseOrgAiEntitlements } from './entitlements'

/**
 * Enforce optional org monthly token cap (organisations.settings.ai_entitlements).
 * No-op when allowance unset or hard_stop is false.
 */
export async function assertOrgAiQuota(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  admin: any,
  orgId: string,
  orgSettings: unknown
): Promise<void> {
  const ent = parseOrgAiEntitlements(orgSettings)
  const allowance = ent.monthly_token_allowance
  if (!allowance || allowance <= 0 || !ent.hard_stop) return

  const now = new Date()
  const monthStart = `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, '0')}-01`
  const lastDay = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 0))
  const monthEnd = lastDay.toISOString().slice(0, 10)

  const { data } = await admin
    .from('ai_usage_daily_org')
    .select('total_tokens')
    .eq('org_id', orgId)
    .gte('event_date', monthStart)
    .lte('event_date', monthEnd)

  const used = ((data ?? []) as Array<{ total_tokens: number | null }>).reduce(
    (sum: number, row) => sum + (Number(row.total_tokens) || 0),
    0
  )
  if (used >= allowance) {
    throw new OrgAiQuotaExceededError()
  }
}

export { OrgAiQuotaExceededError }

/** Org-level AI token entitlements (reseller / quota phase). */

export type OrgAiEntitlements = {
  /** Monthly total token allowance for the org (sum of prompt + completion). */
  monthly_token_allowance?: number
  /** Warn admins when usage reaches this % of allowance (default 80). */
  warn_threshold_pct?: number
  /** When true, block new LLM calls once allowance is exceeded. */
  hard_stop?: boolean
}

export function parseOrgAiEntitlements(settings: unknown): OrgAiEntitlements {
  if (!settings || typeof settings !== 'object') return {}
  const raw = (settings as Record<string, unknown>).ai_entitlements
  if (!raw || typeof raw !== 'object') return {}
  const e = raw as Record<string, unknown>
  return {
    monthly_token_allowance:
      typeof e.monthly_token_allowance === 'number' ? e.monthly_token_allowance : undefined,
    warn_threshold_pct:
      typeof e.warn_threshold_pct === 'number' ? e.warn_threshold_pct : undefined,
    hard_stop: e.hard_stop === true,
  }
}

export class OrgAiQuotaExceededError extends Error {
  constructor(message = 'Organisation AI token allowance exceeded for this month.') {
    super(message)
    this.name = 'OrgAiQuotaExceededError'
  }
}

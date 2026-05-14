/**
 * Learner + org policy for how often LLM calls may infer tutor memory traits
 * (post-message extraction + digest cadence).
 */

export type TutorMemoryLlmCadence = 'off' | 'every_message' | 'daily' | 'weekly'

/** Minimum full days between long-range digest LLM runs (learner preference). */
export type MemoryDigestCadenceDays = 1 | 7 | 30

/** Org may disable all LLM memory inference for members, or set a minimum spacing floor (hours). */
export type TutorLlmMemoryExtractionPolicy = 'learner_controlled' | 'disabled_org_wide'

export function clampTutorMemoryLlmCadence(raw: unknown): TutorMemoryLlmCadence {
  if (raw === 'off' || raw === 'every_message' || raw === 'daily' || raw === 'weekly') return raw
  return 'every_message'
}

export function clampMemoryDigestCadenceDays(raw: unknown): MemoryDigestCadenceDays {
  if (raw === 7 || raw === 30) return raw
  return 1
}

export function cadenceToMinHours(cadence: TutorMemoryLlmCadence): number {
  switch (cadence) {
    case 'off':
      return Number.POSITIVE_INFINITY
    case 'every_message':
      return 0
    case 'daily':
      return 24
    case 'weekly':
      return 168
    default:
      return 0
  }
}

export function clampOrgTutorMemoryMinIntervalHours(raw: unknown): number | null {
  if (raw === null || raw === undefined) return null
  const n = typeof raw === 'number' ? raw : Number(raw)
  if (!Number.isFinite(n) || n <= 0) return null
  return Math.min(Math.floor(n), 8760)
}

export function clampOrgMemoryDigestMinDays(raw: unknown): number | null {
  if (raw === null || raw === undefined) return null
  const n = typeof raw === 'number' ? raw : Number(raw)
  if (!Number.isFinite(n) || n <= 0) return null
  return Math.min(Math.floor(n), 365)
}

export function clampTutorLlmMemoryExtractionPolicy(raw: unknown): TutorLlmMemoryExtractionPolicy {
  if (raw === 'disabled_org_wide') return 'disabled_org_wide'
  return 'learner_controlled'
}

/** Minimum hours between post-message LLM memory extractions after applying org floor. */
export function effectiveTutorMemoryMinIntervalHours(params: {
  learnerCadence: TutorMemoryLlmCadence
  orgMinIntervalHours: number | null | undefined
  orgPolicy: TutorLlmMemoryExtractionPolicy
}): number {
  if (params.orgPolicy === 'disabled_org_wide') return Number.POSITIVE_INFINITY
  if (params.learnerCadence === 'off') return Number.POSITIVE_INFINITY
  const learnerMin = cadenceToMinHours(params.learnerCadence)
  const orgFloor = clampOrgTutorMemoryMinIntervalHours(params.orgMinIntervalHours) ?? 0
  if (!Number.isFinite(learnerMin)) return Number.POSITIVE_INFINITY
  return Math.max(learnerMin, orgFloor)
}

export function shouldRunTutorMemoryLlmExtraction(params: {
  learnerCadence: TutorMemoryLlmCadence
  orgMinIntervalHours: number | null | undefined
  orgPolicy: TutorLlmMemoryExtractionPolicy
  lastExtractionAt: string | undefined
}): boolean {
  const minH = effectiveTutorMemoryMinIntervalHours({
    learnerCadence: params.learnerCadence,
    orgMinIntervalHours: params.orgMinIntervalHours,
    orgPolicy: params.orgPolicy,
  })
  if (!Number.isFinite(minH)) return false
  if (minH <= 0) return true
  if (!params.lastExtractionAt) return true
  const last = new Date(params.lastExtractionAt).getTime()
  if (Number.isNaN(last)) return true
  return Date.now() - last >= minH * 3600_000
}

export function effectiveMemoryDigestMinDays(params: {
  learnerDays: MemoryDigestCadenceDays
  orgMinDays: number | null | undefined
  orgPolicy: TutorLlmMemoryExtractionPolicy
}): number {
  if (params.orgPolicy === 'disabled_org_wide') return Number.POSITIVE_INFINITY
  const org = clampOrgMemoryDigestMinDays(params.orgMinDays)
  const base = params.learnerDays
  if (org == null) return base
  return Math.max(base, org)
}

export function digestEligibleAfterConsolidation(params: {
  consolidatedAt: string | undefined
  minDays: number
}): boolean {
  if (!Number.isFinite(params.minDays)) return false
  if (params.minDays <= 0) return true
  if (!params.consolidatedAt) return true
  const t = new Date(params.consolidatedAt).getTime()
  if (Number.isNaN(t)) return true
  const ms = params.minDays * 86400_000
  return Date.now() - t >= ms
}

/**
 * Course-level AI personalization policy (stored in courses.settings.personalization).
 * Org-level guardrails live in organisations.settings.ai_compliance.
 */

export type PersonalizationAudience = 'org' | 'groups' | 'individuals'

export type PersonalizationFeature = 'course_welcome' | 'module_role_explain' | 'module_brief'

export interface CoursePersonalizationFeatures {
  course_welcome?: boolean
  module_role_explain?: boolean
  module_brief?: boolean
}

export interface CoursePersonalizationSettings {
  features?: CoursePersonalizationFeatures
  audience?: PersonalizationAudience
  group_ids?: string[]
  user_ids?: string[]
}

export interface OrgAiCompliance {
  /** When false, no generative personalization (welcome / module overlays). Default true if omitted. */
  allow_generative_personalization?: boolean
  /** When true, learner must record consent before personalize APIs run. */
  require_learner_consent?: boolean
  /** Documented retention intent; enforcement may be added later. */
  personalization_data_retention_days?: number
  /** Documented retention for learning_events (days); enforcement may be added later. */
  learning_events_retention_days?: number | null
  /** Documented retention for ai_interactions (days); enforcement may be added later. */
  ai_interactions_retention_days?: number | null
  /**
   * When false, skip pre-LLM scans for payment/identity-like patterns in tutor and paste flows.
   * Default true (omit = scan). Not recommended for production.
   */
  block_high_risk_pii_in_tutor?: boolean
  /** When false, do not redact Luhn-valid digit runs from tutor replies. Default true if omitted. */
  tutor_redact_echoed_secrets?: boolean
  /** Reserved: stricter output moderation for high-reg orgs. */
  tutor_output_moderation_strict?: boolean
  /**
   * When true, Sudar may attach web/image search resource cards in course chat (server-side only).
   * Default false if omitted; also gated by TUTOR_WEB_ENRICHMENT_ENABLED on the host.
   */
  tutor_web_enrichment_enabled?: boolean
}

export function defaultPersonalizationSettings(): CoursePersonalizationSettings {
  return {
    audience: 'org',
    group_ids: [],
    user_ids: [],
    features: {
      course_welcome: true,
      module_role_explain: true,
      module_brief: true,
    },
  }
}

export function mergePersonalizationSettings(
  raw: CoursePersonalizationSettings | null | undefined
): CoursePersonalizationSettings {
  const d = defaultPersonalizationSettings()
  if (!raw || typeof raw !== 'object') return d
  return {
    audience: raw.audience ?? d.audience,
    group_ids: Array.isArray(raw.group_ids) ? raw.group_ids : d.group_ids,
    user_ids: Array.isArray(raw.user_ids) ? raw.user_ids : d.user_ids,
    features: {
      ...d.features,
      ...raw.features,
    },
  }
}

export function parsePersonalizationFromCourseSettings(
  settings: unknown
): CoursePersonalizationSettings {
  if (!settings || typeof settings !== 'object') return defaultPersonalizationSettings()
  const p = (settings as Record<string, unknown>).personalization
  if (!p || typeof p !== 'object') return defaultPersonalizationSettings()
  return mergePersonalizationSettings(p as CoursePersonalizationSettings)
}

export function parseOrgAiCompliance(orgSettings: unknown): OrgAiCompliance {
  if (!orgSettings || typeof orgSettings !== 'object') return {}
  const a = (orgSettings as Record<string, unknown>).ai_compliance
  if (!a || typeof a !== 'object') return {}
  return a as OrgAiCompliance
}

export function isFeatureEnabled(
  merged: CoursePersonalizationSettings,
  feature: PersonalizationFeature
): boolean {
  return merged.features?.[feature] !== false
}

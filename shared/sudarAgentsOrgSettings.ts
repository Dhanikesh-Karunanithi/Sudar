/**
 * Org-level Sudar Agents settings (stored in organisations.settings.sudar_agents).
 * Shared by Studio (PATCH UI) and Learn (BFF guards); validation for writes lives in Studio Zod only.
 */

export type SudarAgentsAdminExplanationLevel = 'simple' | 'advanced'

export interface SudarAgentsOrgResolved {
  enabled: boolean
  features: {
    cohort_pulse: boolean
    learner_week_plan: boolean
    spacing_nudges: boolean
  }
  policy_pack_id: string
  admin_explanation_level: SudarAgentsAdminExplanationLevel
}

const DEFAULTS: SudarAgentsOrgResolved = {
  enabled: true,
  features: {
    cohort_pulse: true,
    learner_week_plan: true,
    spacing_nudges: true,
  },
  policy_pack_id: 'default',
  admin_explanation_level: 'simple',
}

export function resolveSudarAgentsFromOrgSettings(settings: Record<string, unknown> | null | undefined): SudarAgentsOrgResolved {
  const raw = settings?.sudar_agents
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    return { ...DEFAULTS, features: { ...DEFAULTS.features } }
  }
  const o = raw as Record<string, unknown>
  const enabled = typeof o.enabled === 'boolean' ? o.enabled : DEFAULTS.enabled
  const feats = typeof o.features === 'object' && o.features !== null && !Array.isArray(o.features)
    ? (o.features as Record<string, unknown>)
    : {}
  const features = {
    cohort_pulse: typeof feats.cohort_pulse === 'boolean' ? feats.cohort_pulse : DEFAULTS.features.cohort_pulse,
    learner_week_plan:
      typeof feats.learner_week_plan === 'boolean' ? feats.learner_week_plan : DEFAULTS.features.learner_week_plan,
    spacing_nudges:
      typeof feats.spacing_nudges === 'boolean' ? feats.spacing_nudges : DEFAULTS.features.spacing_nudges,
  }
  const policy_pack_id =
    typeof o.policy_pack_id === 'string' && o.policy_pack_id.trim().length > 0 ? o.policy_pack_id.trim() : DEFAULTS.policy_pack_id
  const lvl = o.admin_explanation_level === 'advanced' || o.admin_explanation_level === 'simple'
    ? o.admin_explanation_level
    : DEFAULTS.admin_explanation_level
  return {
    enabled,
    features,
    policy_pack_id,
    admin_explanation_level: lvl,
  }
}

export interface SudarAgentsLearnerPrefsResolved {
  week_plan_surfaces: boolean
  spacing_nudges: boolean
}

const LEARNER_DEFAULTS: SudarAgentsLearnerPrefsResolved = {
  week_plan_surfaces: true,
  spacing_nudges: true,
}

export function resolveSudarAgentsLearnerPrefs(preferences: Record<string, unknown> | null | undefined): SudarAgentsLearnerPrefsResolved {
  const raw = preferences?.sudar_agents
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    return { ...LEARNER_DEFAULTS }
  }
  const o = raw as Record<string, unknown>
  const fromDashboard = o.week_plan_surfaces
  const legacyDashboard = o.week_plan_dashboard
  const surfaces =
    typeof fromDashboard === 'boolean'
      ? fromDashboard
      : typeof legacyDashboard === 'boolean'
        ? legacyDashboard
        : LEARNER_DEFAULTS.week_plan_surfaces
  return {
    week_plan_surfaces: surfaces,
    spacing_nudges: typeof o.spacing_nudges === 'boolean' ? o.spacing_nudges : LEARNER_DEFAULTS.spacing_nudges,
  }
}

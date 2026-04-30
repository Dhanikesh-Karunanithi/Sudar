/**
 * Org + learner guards for Sudar Agents (Learn).
 */
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'
import {
  resolveSudarAgentsFromOrgSettings,
  resolveSudarAgentsLearnerPrefs,
  type SudarAgentsOrgResolved,
  type SudarAgentsLearnerPrefsResolved,
} from '../../../../shared/sudarAgentsOrgSettings'
import { parseOrgAiCompliance } from '@/types/personalization'

export type LearnerAgentsAccess = {
  orgId: string
  resolved: SudarAgentsOrgResolved
  learnerPrefs: SudarAgentsLearnerPrefsResolved
  /** False when org requires consent and learner has not consented — block personalization-style agent runs */
  personalizationOk: boolean
}

export async function loadLearnerAgentsAccess(
  admin: SupabaseClient<Database>,
  userId: string,
): Promise<LearnerAgentsAccess | null> {
  const { data: profile, error: pErr } = await admin.from('profiles').select('org_id').eq('id', userId).maybeSingle()
  if (pErr || !profile?.org_id) return null

  const orgId = profile.org_id as string
  const [{ data: orgRow }, { data: lp }] = await Promise.all([
    admin.from('organisations').select('settings').eq('id', orgId).maybeSingle(),
    admin.from('learner_profiles').select('ai_tutor_context, generative_ai_consent_at').eq('user_id', userId).maybeSingle(),
  ])

  const settings = (orgRow?.settings as Record<string, unknown>) ?? {}
  const resolved = resolveSudarAgentsFromOrgSettings(settings)
  const prefsRoot = (
    lp?.ai_tutor_context && typeof lp.ai_tutor_context === 'object' && lp.ai_tutor_context !== null && !Array.isArray(lp.ai_tutor_context)
      ? ((lp.ai_tutor_context as Record<string, unknown>).preferences as Record<string, unknown> | undefined)
      : undefined
  ) ?? {}
  const learnerPrefs = resolveSudarAgentsLearnerPrefs(prefsRoot)

  const compliance = parseOrgAiCompliance(orgRow?.settings)
  const consentAt = lp?.generative_ai_consent_at
  const personalizationOk =
    compliance.require_learner_consent !== true || (typeof consentAt === 'string' && consentAt.length > 0)

  return {
    orgId,
    resolved,
    learnerPrefs,
    personalizationOk,
  }
}

export function learnerRunBlockedReason(access: LearnerAgentsAccess, goal_kind: string): string | null {
  if (!access.resolved.enabled) {
    return 'Sudar Agents are turned off for your organisation.'
  }
  const gk = goal_kind || 'week_plan'
  const needsLearnerFeature = ['week_plan', 'remediation', 'spacing_digest', 'custom'].includes(gk)
  if (needsLearnerFeature && !access.resolved.features.learner_week_plan) {
    return 'Learner Sudar Agents are disabled for your organisation.'
  }
  if (needsLearnerFeature && !access.personalizationOk) {
    return 'Your organisation requires consent for personalization before Sudar automation can run. Update consent in onboarding or preferences.'
  }
  return null
}

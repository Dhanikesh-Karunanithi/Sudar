import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'
import {
  isFeatureEnabled,
  mergePersonalizationSettings,
  parseOrgAiCompliance,
  parsePersonalizationFromCourseSettings,
  type PersonalizationFeature,
  type CoursePersonalizationSettings,
} from '@/types/personalization'

export type PersonalizationEligibility =
  | { allowed: true }
  | { allowed: false; reason: string }

type EligibilityContext = {
  isAdaptive: boolean
  learnerOrgId: string | null
  courseOrgId: string
  compliance: ReturnType<typeof parseOrgAiCompliance>
  consentAt: string | null | undefined
  policy: CoursePersonalizationSettings
  audienceOk: boolean
  audienceReason: string
}

async function buildEligibilityContext(
  admin: SupabaseClient<Database>,
  userId: string,
  courseId: string
): Promise<{ ctx: EligibilityContext | null; courseMissing: boolean }> {
  const [{ data: course, error: courseErr }, { data: profile, error: profileErr }, { data: lp }] =
    await Promise.all([
      admin.from('courses').select('org_id, settings, is_adaptive').eq('id', courseId).single(),
      admin.from('profiles').select('org_id').eq('id', userId).single(),
      admin.from('learner_profiles').select('generative_ai_consent_at').eq('user_id', userId).single(),
    ])

  if (courseErr || !course) {
    return { ctx: null, courseMissing: true }
  }
  if (profileErr || !profile) {
    return { ctx: null, courseMissing: false }
  }

  const courseOrgId = course.org_id as string
  const { data: orgRow } = await admin
    .from('organisations')
    .select('settings')
    .eq('id', courseOrgId)
    .single()

  const compliance = parseOrgAiCompliance(orgRow?.settings)
  const policy = mergePersonalizationSettings(
    parsePersonalizationFromCourseSettings(course.settings)
  )

  let audienceOk = true
  let audienceReason = ''
  const audience = policy.audience ?? 'org'

  if (audience === 'groups') {
    const gids = policy.group_ids ?? []
    if (gids.length === 0) {
      audienceOk = false
      audienceReason =
        'This course limits personalization to selected groups, but none are configured.'
    } else {
      const { data: rows, error: gErr } = await admin
        .from('learner_group_members')
        .select('group_id')
        .eq('user_id', userId)
        .in('group_id', gids)
        .limit(1)

      if (gErr || !rows?.length) {
        audienceOk = false
        audienceReason =
          'You are not in a learner group that can use personalization for this course.'
      }
    }
  } else if (audience === 'individuals') {
    const uids = policy.user_ids ?? []
    if (uids.length === 0) {
      audienceOk = false
      audienceReason =
        'This course limits personalization to selected individuals, but none are configured.'
    } else if (!uids.includes(userId)) {
      audienceOk = false
      audienceReason =
        'You are not on the list of learners who can use personalization for this course.'
    }
  }

  return {
    ctx: {
      isAdaptive: course.is_adaptive === true,
      learnerOrgId: profile.org_id as string | null,
      courseOrgId,
      compliance,
      consentAt: lp?.generative_ai_consent_at as string | null | undefined,
      policy,
      audienceOk,
      audienceReason,
    },
    courseMissing: false,
  }
}

function eligibilityForFeature(
  ctx: EligibilityContext,
  feature: PersonalizationFeature
): PersonalizationEligibility {
  if (!ctx.isAdaptive) {
    return {
      allowed: false,
      reason: 'This course does not have adaptive personalization enabled.',
    }
  }

  if (!isFeatureEnabled(ctx.policy, feature)) {
    return {
      allowed: false,
      reason: 'This type of personalization is turned off for this course.',
    }
  }

  if (!ctx.learnerOrgId || ctx.learnerOrgId !== ctx.courseOrgId) {
    return { allowed: false, reason: 'You are not in the same organization as this course.' }
  }

  if (ctx.compliance.allow_generative_personalization === false) {
    return {
      allowed: false,
      reason: 'Your organization has turned off AI personalization.',
    }
  }

  if (ctx.compliance.require_learner_consent === true && !ctx.consentAt) {
    return {
      allowed: false,
      reason:
        'Please accept AI personalization in Settings (or the prompt shown to you) to continue.',
    }
  }

  if (!ctx.audienceOk) {
    return { allowed: false, reason: ctx.audienceReason }
  }

  return { allowed: true }
}

export async function checkPersonalizationEligibility(
  admin: SupabaseClient<Database>,
  params: {
    userId: string
    courseId: string
    feature: PersonalizationFeature
  }
): Promise<PersonalizationEligibility> {
  const { userId, courseId, feature } = params
  const { ctx, courseMissing } = await buildEligibilityContext(admin, userId, courseId)
  if (courseMissing) {
    return { allowed: false, reason: 'Course not found.' }
  }
  if (!ctx) {
    return { allowed: false, reason: 'Profile not found.' }
  }
  return eligibilityForFeature(ctx, feature)
}

export type PersonalizationAccessFlags = {
  courseWelcome: PersonalizationEligibility
  moduleRoleExplain: PersonalizationEligibility
  moduleBrief: PersonalizationEligibility
  orgRequiresConsent: boolean
  hasConsent: boolean
}

export async function resolvePersonalizationAccess(
  admin: SupabaseClient<Database>,
  userId: string,
  courseId: string
): Promise<PersonalizationAccessFlags> {
  const { ctx, courseMissing } = await buildEligibilityContext(admin, userId, courseId)
  const empty: PersonalizationEligibility = courseMissing
    ? { allowed: false, reason: 'Course not found.' }
    : { allowed: false, reason: 'Profile not found.' }

  if (!ctx) {
    return {
      courseWelcome: empty,
      moduleRoleExplain: empty,
      moduleBrief: empty,
      orgRequiresConsent: false,
      hasConsent: false,
    }
  }

  return {
    courseWelcome: eligibilityForFeature(ctx, 'course_welcome'),
    moduleRoleExplain: eligibilityForFeature(ctx, 'module_role_explain'),
    moduleBrief: eligibilityForFeature(ctx, 'module_brief'),
    orgRequiresConsent: ctx.compliance.require_learner_consent === true,
    hasConsent: !!ctx.consentAt,
  }
}

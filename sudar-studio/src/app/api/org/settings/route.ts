import { createClient, createServiceRoleSupabaseClient } from '@/lib/supabase/server'
import { requireOrgAdmin } from '@/lib/org'
import { NextResponse } from 'next/server'
import { performanceConfigSchema } from '@/types/performance'
import { orgAiCompliancePatchSchema } from '@/types/orgCompliance'
import {
  orgAiRuntimePolicySchema,
  parseOrgAiRuntimePolicy,
  getPrivateLlmBearerToken,
  isOrgPrivateAiFeatureEnabled,
  orgAiInferencePatchSchema,
  parseOrgAiInference,
  validateOrgPrivateServerUrl,
  type OrgAiInferenceStored,
} from '@/types/orgAiInference'
import type { Json } from '@/types/database'
import { normalizeTtsVoiceId, TTS_VOICE_OPTIONS_BY_ID } from '@/lib/audio/voices'
import { orgSudarAgentsPatchSchema } from '@/types/orgSudarAgents'
import { resolveSudarAgentsFromOrgSettings } from '../../../../../../shared/sudarAgentsOrgSettings'
import { isAppLocale } from '../../../../../../shared/i18nLocales'
import {
  isFreellmapiConfigured,
  isOrgPlatformAiFeatureEnabled,
  orgAiPlatformPatchSchema,
  parseOrgAiPlatform,
} from '../../../../../../shared/ai/orgAiPlatform'

/**
 * GET /api/org/settings — Return current org settings (performance_config, etc.). Admin/Manager only.
 */
export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let orgId: string
  try {
    orgId = await requireOrgAdmin(user.id)
  } catch {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const admin = createServiceRoleSupabaseClient()
  const { data: org } = await admin
    .from('organisations')
    .select('settings')
    .eq('id', orgId)
    .single()

  const settings = (org?.settings as Record<string, unknown>) ?? {}
  const performance_config = settings.performance_config ?? null
  const ai_models = (settings.ai_models as Record<string, string | null> | undefined) ?? {}
  const normalizedOrgTts = normalizeTtsVoiceId(ai_models.tts_voice)
  const sso_config = (settings.sso_config as Record<string, unknown> | undefined) ?? null
  const ai_compliance = (settings.ai_compliance as Record<string, unknown> | undefined) ?? {}
  const notification_policy = (settings.notification_policy as Record<string, unknown> | undefined) ?? {}
  const notification_branding = (settings.notification_branding as Record<string, unknown> | undefined) ?? {}
  const ai_inference = parseOrgAiInference(settings)
  const ai_runtime = parseOrgAiRuntimePolicy(settings)
  const ai_platform = parseOrgAiPlatform(settings)
  const sudar_agents = resolveSudarAgentsFromOrgSettings(settings)

  const localizationRaw = (settings.localization as Record<string, unknown> | undefined) ?? {}
  const default_ui_locale =
    typeof localizationRaw.default_ui_locale === 'string' && isAppLocale(localizationRaw.default_ui_locale)
      ? localizationRaw.default_ui_locale
      : null

  return NextResponse.json({
    performance_config,
    institution_type: (performance_config as Record<string, unknown>)?.institution_type ?? null,
    kpis: (performance_config as Record<string, unknown>)?.kpis ?? [],
    scale: (performance_config as Record<string, unknown>)?.scale ?? null,
    terms: (performance_config as Record<string, unknown>)?.terms ?? [],
    ai_models: {
      tts_voice: normalizedOrgTts ?? null,
      content_generation_model: ai_models.content_generation_model ?? null,
      tutor_model: ai_models.tutor_model ?? null,
    },
    sso_config,
    ai_compliance: {
      allow_generative_personalization: ai_compliance.allow_generative_personalization !== false,
      require_learner_consent: ai_compliance.require_learner_consent === true,
      personalization_data_retention_days:
        typeof ai_compliance.personalization_data_retention_days === 'number'
          ? ai_compliance.personalization_data_retention_days
          : null,
      learning_events_retention_days:
        typeof ai_compliance.learning_events_retention_days === 'number'
          ? ai_compliance.learning_events_retention_days
          : null,
      ai_interactions_retention_days:
        typeof ai_compliance.ai_interactions_retention_days === 'number'
          ? ai_compliance.ai_interactions_retention_days
          : null,
      block_high_risk_pii_in_tutor: ai_compliance.block_high_risk_pii_in_tutor !== false,
      tutor_redact_echoed_secrets: ai_compliance.tutor_redact_echoed_secrets !== false,
      tutor_output_moderation_strict: ai_compliance.tutor_output_moderation_strict === true,
      tutor_llm_memory_extraction_policy:
        ai_compliance.tutor_llm_memory_extraction_policy === 'disabled_org_wide'
          ? 'disabled_org_wide'
          : 'learner_controlled',
      tutor_llm_memory_min_interval_hours:
        typeof ai_compliance.tutor_llm_memory_min_interval_hours === 'number'
          ? ai_compliance.tutor_llm_memory_min_interval_hours
          : null,
      memory_digest_min_interval_days_org:
        typeof ai_compliance.memory_digest_min_interval_days_org === 'number'
          ? ai_compliance.memory_digest_min_interval_days_org
          : null,
    },
    notification_policy: {
      mandatory_categories: Array.isArray(notification_policy.mandatory_categories) ? notification_policy.mandatory_categories : [],
      global_daily_cap:
        typeof notification_policy.global_daily_cap === 'number'
          ? notification_policy.global_daily_cap
          : 8,
      global_weekly_cap:
        typeof notification_policy.global_weekly_cap === 'number'
          ? notification_policy.global_weekly_cap
          : 35,
      vertical_preset:
        typeof notification_policy.vertical_preset === 'string'
          ? notification_policy.vertical_preset
          : 'corporate_ld',
    },
    notification_branding: {
      accent_color:
        typeof notification_branding.accent_color === 'string'
          ? notification_branding.accent_color
          : '#6d28d9',
      logo_url:
        typeof notification_branding.logo_url === 'string'
          ? notification_branding.logo_url
          : null,
      from_name:
        typeof notification_branding.from_name === 'string'
          ? notification_branding.from_name
          : 'Sudar',
    },
    ai_inference: {
      ...ai_inference,
      feature_available: isOrgPrivateAiFeatureEnabled(),
      bearer_configured: Boolean(getPrivateLlmBearerToken()),
    },
    ai_runtime: {
      ...ai_runtime,
      feature_available: isOrgPrivateAiFeatureEnabled(),
      bearer_configured: Boolean(getPrivateLlmBearerToken()),
    },
    ai_platform: {
      ...ai_platform,
      feature_available: isOrgPlatformAiFeatureEnabled(),
      freellmapi_configured: isFreellmapiConfigured(),
    },
    sudar_agents,
    localization: {
      default_ui_locale,
    },
  })
}

/**
 * PATCH /api/org/settings — Update org performance_config. Admin/Manager only.
 */
export async function PATCH(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let orgId: string
  try {
    orgId = await requireOrgAdmin(user.id)
  } catch {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await request.json()
  const admin = createServiceRoleSupabaseClient()
  const { data: org } = await admin
    .from('organisations')
    .select('settings')
    .eq('id', orgId)
    .single()

  const currentSettings = (org?.settings as Record<string, unknown>) ?? {}
  const updatedSettings: Record<string, unknown> = { ...currentSettings }

  if (body.performance_config !== undefined) {
    const parsed = performanceConfigSchema.safeParse(body.performance_config)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid performance_config', details: parsed.error.flatten() }, { status: 400 })
    }
    updatedSettings.performance_config = parsed.data
  }

  if (body.ai_models !== undefined && typeof body.ai_models === 'object') {
    const ai = body.ai_models as Record<string, string | null>
    const normalizedIncomingTts = ai.tts_voice !== undefined && ai.tts_voice !== null
      ? normalizeTtsVoiceId(ai.tts_voice)
      : ai.tts_voice
    if (normalizedIncomingTts !== undefined && normalizedIncomingTts !== null && !TTS_VOICE_OPTIONS_BY_ID[normalizedIncomingTts]) {
      return NextResponse.json({ error: 'Invalid tts_voice' }, { status: 400 })
    }
    updatedSettings.ai_models = {
      ...(typeof currentSettings.ai_models === 'object' && currentSettings.ai_models !== null
        ? (currentSettings.ai_models as Record<string, unknown>)
        : {}),
      ...(normalizedIncomingTts !== undefined && { tts_voice: normalizedIncomingTts }),
      ...(ai.content_generation_model !== undefined && { content_generation_model: ai.content_generation_model }),
      ...(ai.tutor_model !== undefined && { tutor_model: ai.tutor_model }),
    }
  }

  if (body.sso_config !== undefined) {
    const raw = body.sso_config
    if (raw === null || (typeof raw === 'object' && !Array.isArray(raw))) {
      updatedSettings.sso_config = raw as Record<string, unknown> | null
    }
  }

  if (body.localization !== undefined) {
    if (typeof body.localization !== 'object' || body.localization === null || Array.isArray(body.localization)) {
      return NextResponse.json({ error: 'Invalid localization' }, { status: 400 })
    }
    const incoming = body.localization as Record<string, unknown>
    const prev =
      typeof currentSettings.localization === 'object' && currentSettings.localization !== null && !Array.isArray(currentSettings.localization)
        ? (currentSettings.localization as Record<string, unknown>)
        : {}
    const next: Record<string, unknown> = { ...prev }
    if ('default_ui_locale' in incoming) {
      const v = incoming.default_ui_locale
      if (v === null || v === '') {
        delete next.default_ui_locale
      } else if (typeof v === 'string' && isAppLocale(v)) {
        next.default_ui_locale = v
      }
    }
    updatedSettings.localization = next
  }

  if (body.ai_compliance !== undefined) {
    if (typeof body.ai_compliance !== 'object' || body.ai_compliance === null || Array.isArray(body.ai_compliance)) {
      return NextResponse.json({ error: 'Invalid ai_compliance' }, { status: 400 })
    }
    const parsed = orgAiCompliancePatchSchema.safeParse(body.ai_compliance)
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid ai_compliance', details: parsed.error.flatten() },
        { status: 400 }
      )
    }
    const prev = (typeof currentSettings.ai_compliance === 'object' && currentSettings.ai_compliance !== null
      ? (currentSettings.ai_compliance as Record<string, unknown>)
      : {})
    const merged: Record<string, unknown> = { ...prev }
    for (const [key, value] of Object.entries(parsed.data)) {
      if (value !== undefined) merged[key] = value
    }
    updatedSettings.ai_compliance = merged
  }

  if (body.notification_policy !== undefined) {
    if (typeof body.notification_policy !== 'object' || body.notification_policy === null || Array.isArray(body.notification_policy)) {
      return NextResponse.json({ error: 'Invalid notification_policy' }, { status: 400 })
    }
    const incoming = body.notification_policy as Record<string, unknown>
    const prev = (typeof currentSettings.notification_policy === 'object' && currentSettings.notification_policy !== null
      ? (currentSettings.notification_policy as Record<string, unknown>)
      : {})
    updatedSettings.notification_policy = {
      ...prev,
      ...(Array.isArray(incoming.mandatory_categories) ? { mandatory_categories: incoming.mandatory_categories } : {}),
      ...(typeof incoming.global_daily_cap === 'number' ? { global_daily_cap: incoming.global_daily_cap } : {}),
      ...(typeof incoming.global_weekly_cap === 'number' ? { global_weekly_cap: incoming.global_weekly_cap } : {}),
      ...(typeof incoming.vertical_preset === 'string' ? { vertical_preset: incoming.vertical_preset } : {}),
    }
  }

  if (body.notification_branding !== undefined) {
    if (typeof body.notification_branding !== 'object' || body.notification_branding === null || Array.isArray(body.notification_branding)) {
      return NextResponse.json({ error: 'Invalid notification_branding' }, { status: 400 })
    }
    const incoming = body.notification_branding as Record<string, unknown>
    const prev = (typeof currentSettings.notification_branding === 'object' && currentSettings.notification_branding !== null
      ? (currentSettings.notification_branding as Record<string, unknown>)
      : {})
    updatedSettings.notification_branding = {
      ...prev,
      ...(typeof incoming.accent_color === 'string' ? { accent_color: incoming.accent_color } : {}),
      ...(typeof incoming.logo_url === 'string' || incoming.logo_url === null ? { logo_url: incoming.logo_url } : {}),
      ...(typeof incoming.from_name === 'string' ? { from_name: incoming.from_name } : {}),
    }
  }

  if (body.ai_inference !== undefined) {
    if (!isOrgPrivateAiFeatureEnabled()) {
      return NextResponse.json(
        { error: 'Organisation private AI is not enabled on this deployment (ALLOW_ORG_PRIVATE_AI_SERVER).' },
        { status: 403 }
      )
    }
    if (typeof body.ai_inference !== 'object' || body.ai_inference === null || Array.isArray(body.ai_inference)) {
      return NextResponse.json({ error: 'Invalid ai_inference' }, { status: 400 })
    }
    const parsed = orgAiInferencePatchSchema.safeParse(body.ai_inference)
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid ai_inference', details: parsed.error.flatten() },
        { status: 400 }
      )
    }
    const prev = parseOrgAiInference(currentSettings)
    const patch = parsed.data
    const mergedInference: OrgAiInferenceStored = {
      use_private_server: patch.use_private_server ?? prev.use_private_server,
      private_server_url: patch.private_server_url !== undefined ? patch.private_server_url : prev.private_server_url,
      private_server_model:
        patch.private_server_model !== undefined ? patch.private_server_model : prev.private_server_model,
    }
    if (mergedInference.use_private_server) {
      if (!mergedInference.private_server_url.trim()) {
        return NextResponse.json({ error: 'Private AI requires a server address.' }, { status: 400 })
      }
      const urlCheck = validateOrgPrivateServerUrl(mergedInference.private_server_url)
      if (!urlCheck.ok) {
        return NextResponse.json({ error: urlCheck.error }, { status: 400 })
      }
      if (!mergedInference.private_server_model.trim()) {
        return NextResponse.json({ error: 'Private AI requires a model name (e.g. gemma3:4b).' }, { status: 400 })
      }
      if (!getPrivateLlmBearerToken()) {
        return NextResponse.json(
          {
            error:
              'Private AI requires LOCAL_LLM_BEARER_TOKEN or AI_CHAT_API_KEY on the server. Your IT team sets this once in deployment settings, not in this form.',
          },
          { status: 400 }
        )
      }
    }
    updatedSettings.ai_inference = mergedInference
  }

  if (body.ai_runtime !== undefined) {
    if (!isOrgPrivateAiFeatureEnabled()) {
      return NextResponse.json(
        { error: 'Local BYOM mode is not enabled on this deployment (ALLOW_ORG_PRIVATE_AI_SERVER).' },
        { status: 403 }
      )
    }
    if (typeof body.ai_runtime !== 'object' || body.ai_runtime === null || Array.isArray(body.ai_runtime)) {
      return NextResponse.json({ error: 'Invalid ai_runtime' }, { status: 400 })
    }
    const parsed = orgAiRuntimePolicySchema.safeParse(body.ai_runtime)
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid ai_runtime', details: parsed.error.flatten() },
        { status: 400 }
      )
    }
    for (const provider of parsed.data.providers) {
      const urlCheck = validateOrgPrivateServerUrl(provider.base_url)
      if (!urlCheck.ok) {
        return NextResponse.json({ error: `Provider "${provider.id}": ${urlCheck.error}` }, { status: 400 })
      }
      if (provider.auth_mode === 'bearer' && !getPrivateLlmBearerToken()) {
        return NextResponse.json(
          {
            error:
              'Bearer local provider requires LOCAL_LLM_BEARER_TOKEN or AI_CHAT_API_KEY on the deployment.',
          },
          { status: 400 }
        )
      }
    }
    updatedSettings.ai_runtime = parsed.data
  }

  if (body.ai_platform !== undefined) {
    if (!isOrgPlatformAiFeatureEnabled()) {
      return NextResponse.json(
        { error: 'Sudar AI (included pilot tier) is not enabled on this deployment (ALLOW_ORG_PLATFORM_AI).' },
        { status: 403 }
      )
    }
    if (typeof body.ai_platform !== 'object' || body.ai_platform === null || Array.isArray(body.ai_platform)) {
      return NextResponse.json({ error: 'Invalid ai_platform' }, { status: 400 })
    }
    const parsed = orgAiPlatformPatchSchema.safeParse(body.ai_platform)
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid ai_platform', details: parsed.error.flatten() },
        { status: 400 }
      )
    }
    const prev = parseOrgAiPlatform(currentSettings)
    updatedSettings.ai_platform = {
      enabled: parsed.data.enabled ?? prev.enabled,
      label: parsed.data.label ?? prev.label,
      model: parsed.data.model ?? prev.model,
    }
  }

  if (body.sudar_agents !== undefined) {
    if (typeof body.sudar_agents !== 'object' || body.sudar_agents === null || Array.isArray(body.sudar_agents)) {
      return NextResponse.json({ error: 'Invalid sudar_agents' }, { status: 400 })
    }
    const parsed = orgSudarAgentsPatchSchema.safeParse(body.sudar_agents)
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid sudar_agents', details: parsed.error.flatten() },
        { status: 400 }
      )
    }
    const prevRaw =
      typeof currentSettings.sudar_agents === 'object' && currentSettings.sudar_agents !== null && !Array.isArray(currentSettings.sudar_agents)
        ? (currentSettings.sudar_agents as Record<string, unknown>)
        : {}
    const prevFeat =
      typeof prevRaw.features === 'object' && prevRaw.features !== null && !Array.isArray(prevRaw.features)
        ? (prevRaw.features as Record<string, unknown>)
        : {}
    const merged: Record<string, unknown> = {
      ...prevRaw,
      ...(parsed.data.enabled !== undefined ? { enabled: parsed.data.enabled } : {}),
      ...(parsed.data.policy_pack_id !== undefined ? { policy_pack_id: parsed.data.policy_pack_id } : {}),
      ...(parsed.data.admin_explanation_level !== undefined
        ? { admin_explanation_level: parsed.data.admin_explanation_level }
        : {}),
    }
    if (parsed.data.features !== undefined) {
      merged.features = {
        ...prevFeat,
        ...(parsed.data.features.cohort_pulse !== undefined
          ? { cohort_pulse: parsed.data.features.cohort_pulse }
          : {}),
        ...(parsed.data.features.learner_week_plan !== undefined
          ? { learner_week_plan: parsed.data.features.learner_week_plan }
          : {}),
        ...(parsed.data.features.spacing_nudges !== undefined
          ? { spacing_nudges: parsed.data.features.spacing_nudges }
          : {}),
      }
    } else if (Object.keys(prevFeat).length > 0) {
      merged.features = { ...prevFeat }
    }
    updatedSettings.sudar_agents = merged
  }

  const { error } = await admin
    .from('organisations')
    .update({ settings: updatedSettings as Json })
    .eq('id', orgId)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true, settings: updatedSettings })
}

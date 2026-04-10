import { createClient, createAdminClient } from '@/lib/supabase/server'
import { requireOrgAdmin } from '@/lib/org'
import { NextResponse } from 'next/server'
import { performanceConfigSchema } from '@/types/performance'
import { orgAiCompliancePatchSchema } from '@/types/orgCompliance'
import {
  getPrivateLlmBearerToken,
  isOrgPrivateAiFeatureEnabled,
  orgAiInferencePatchSchema,
  parseOrgAiInference,
  validateOrgPrivateServerUrl,
  type OrgAiInferenceStored,
} from '@/types/orgAiInference'
import type { Json } from '@/types/database'

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

  const admin = createAdminClient()
  const { data: org } = await admin
    .from('organisations')
    .select('settings')
    .eq('id', orgId)
    .single()

  const settings = (org?.settings as Record<string, unknown>) ?? {}
  const performance_config = settings.performance_config ?? null
  const ai_models = (settings.ai_models as Record<string, string | null> | undefined) ?? {}
  const sso_config = (settings.sso_config as Record<string, unknown> | undefined) ?? null
  const ai_compliance = (settings.ai_compliance as Record<string, unknown> | undefined) ?? {}
  const ai_inference = parseOrgAiInference(settings)

  return NextResponse.json({
    performance_config,
    institution_type: (performance_config as Record<string, unknown>)?.institution_type ?? null,
    kpis: (performance_config as Record<string, unknown>)?.kpis ?? [],
    scale: (performance_config as Record<string, unknown>)?.scale ?? null,
    terms: (performance_config as Record<string, unknown>)?.terms ?? [],
    ai_models: {
      tts_voice: ai_models.tts_voice ?? null,
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
    },
    ai_inference: {
      ...ai_inference,
      feature_available: isOrgPrivateAiFeatureEnabled(),
      bearer_configured: Boolean(getPrivateLlmBearerToken()),
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
  const admin = createAdminClient()
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
    updatedSettings.ai_models = {
      ...(typeof currentSettings.ai_models === 'object' && currentSettings.ai_models !== null
        ? (currentSettings.ai_models as Record<string, unknown>)
        : {}),
      ...(ai.tts_voice !== undefined && { tts_voice: ai.tts_voice }),
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

  const { error } = await admin
    .from('organisations')
    .update({ settings: updatedSettings as Json })
    .eq('id', orgId)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true, settings: updatedSettings })
}

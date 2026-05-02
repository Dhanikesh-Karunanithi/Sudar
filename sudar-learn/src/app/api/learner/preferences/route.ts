import { createClient, createServiceRoleSupabaseClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import type { MascotId, MascotIntensity, MascotMode, MascotSupportStyle } from '@/types/mascot'
import { computeProfileCompleteness } from '@/lib/gamification/profileCompleteness'
import { evaluateGamification } from '@/lib/gamification/engine'
import { normalizeTtsVoiceId, TTS_VOICE_OPTIONS_BY_ID } from '@/lib/audio/voices'
import { loadLearnerAgentsAccess } from '@/lib/org/sudarAgentsAccess'
import { resolveSudarAgentsLearnerPrefs } from '../../../../../../shared/sudarAgentsOrgSettings'

const MASCOT_IDS: MascotId[] = ['focus', 'memory', 'confidence', 'sudar']
const MASCOT_MODES: MascotMode[] = ['all', 'selected', 'hero-only']
const MASCOT_STYLES: MascotSupportStyle[] = ['calm', 'balanced', 'energetic']
const MASCOT_INTENSITIES: MascotIntensity[] = ['low', 'medium', 'high']

/**
 * GET /api/learner/preferences — Return learner AI preferences (TTS voice, optional tutor model).
 */
export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const admin = createServiceRoleSupabaseClient()
  const { data: profile } = await admin
    .from('learner_profiles')
    .select('ai_tutor_context')
    .eq('user_id', user.id)
    .single()

  const ctx = (profile?.ai_tutor_context as Record<string, unknown>) ?? {}
  const prefs = (ctx.preferences as Record<string, string | null>) ?? {}
  const normalizedTtsVoice = normalizeTtsVoiceId(prefs.tts_voice)
  const access = await loadLearnerAgentsAccess(admin, user.id)
  const sudar_agents_prefs = resolveSudarAgentsLearnerPrefs(
    (prefs as Record<string, unknown>) ?? {},
  )
  const org_agents_gate = access
    ? {
        enabled: access.resolved.enabled,
        learner_week_plan: access.resolved.features.learner_week_plan,
        spacing_nudges_org: access.resolved.features.spacing_nudges,
      }
    : null
  return NextResponse.json({
    tts_voice: normalizedTtsVoice ?? null,
    tutor_model: prefs.tutor_model ?? null,
    mascot_mode: prefs.mascot_mode ?? 'all',
    mascot_style: prefs.mascot_style ?? 'balanced',
    mascot_intensity: prefs.mascot_intensity ?? 'high',
    mascot_companions: Array.isArray(prefs.mascot_companions) ? prefs.mascot_companions : ['focus', 'memory', 'confidence'],
    sudar_agents: sudar_agents_prefs,
    org_sudar_agents: org_agents_gate,
  })
}

/**
 * PATCH /api/learner/preferences — Update learner AI preferences. Merges into ai_tutor_context.preferences.
 */
export async function PATCH(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json().catch(() => ({}))
  const normalizedBodyTtsVoice = typeof body.tts_voice === 'string'
    ? normalizeTtsVoiceId(body.tts_voice)
    : null
  const tts_voice = normalizedBodyTtsVoice && TTS_VOICE_OPTIONS_BY_ID[normalizedBodyTtsVoice]
    ? normalizedBodyTtsVoice
    : undefined
  const tutor_model = typeof body.tutor_model === 'string' ? body.tutor_model : undefined
  const mascot_mode = MASCOT_MODES.includes(body.mascot_mode) ? (body.mascot_mode as MascotMode) : undefined
  const mascot_style = MASCOT_STYLES.includes(body.mascot_style) ? (body.mascot_style as MascotSupportStyle) : undefined
  const mascot_intensity = MASCOT_INTENSITIES.includes(body.mascot_intensity) ? (body.mascot_intensity as MascotIntensity) : undefined
  const mascot_companions = Array.isArray(body.mascot_companions)
    ? body.mascot_companions.filter((id: unknown): id is MascotId => typeof id === 'string' && MASCOT_IDS.includes(id as MascotId))
    : undefined
  let sudar_agents_patch: Record<string, boolean> | undefined
  if (
    typeof body.sudar_agents === 'object'
    && body.sudar_agents !== null
    && !Array.isArray(body.sudar_agents)
  ) {
    const sa = body.sudar_agents as Record<string, unknown>
    const next: Record<string, boolean> = {}
    if (typeof sa.week_plan_surfaces === 'boolean') next.week_plan_surfaces = sa.week_plan_surfaces
    if (typeof sa.spacing_nudges === 'boolean') next.spacing_nudges = sa.spacing_nudges
    if (Object.keys(next).length > 0) sudar_agents_patch = next
  }
  if (
    tts_voice === undefined
    && tutor_model === undefined
    && mascot_mode === undefined
    && mascot_style === undefined
    && mascot_intensity === undefined
    && mascot_companions === undefined
    && sudar_agents_patch === undefined
  ) {
    return NextResponse.json({ error: 'Provide at least one valid preference value' }, { status: 400 })
  }

  const admin = createServiceRoleSupabaseClient()
  const { data: profile } = await admin
    .from('learner_profiles')
    .select('ai_tutor_context')
    .eq('user_id', user.id)
    .single()

  const ctx = (profile?.ai_tutor_context as Record<string, unknown>) ?? {}
  const existingPrefs = (ctx.preferences as Record<string, unknown>) ?? {}
  const existingSudarAgents =
    typeof existingPrefs.sudar_agents === 'object'
    && existingPrefs.sudar_agents !== null
    && !Array.isArray(existingPrefs.sudar_agents)
      ? (existingPrefs.sudar_agents as Record<string, unknown>)
      : {}
  const updatedSudarAgents =
    sudar_agents_patch !== undefined ? { ...existingSudarAgents, ...sudar_agents_patch } : undefined
  const updatedPrefs = {
    ...existingPrefs,
    ...(tts_voice !== undefined && { tts_voice }),
    ...(tutor_model !== undefined && { tutor_model }),
    ...(mascot_mode !== undefined && { mascot_mode }),
    ...(mascot_style !== undefined && { mascot_style }),
    ...(mascot_intensity !== undefined && { mascot_intensity }),
    ...(mascot_companions !== undefined && { mascot_companions }),
    ...(updatedSudarAgents !== undefined && { sudar_agents: updatedSudarAgents }),
  }
  const updatedCtx: Record<string, unknown> = { ...ctx, preferences: updatedPrefs }
  const hasOrgContext = hasValue(updatedCtx.role_context)

  const { data: existingProfile } = await admin
    .from('profiles')
    .select('org_id')
    .eq('id', user.id)
    .single()

  const { data: existing } = await admin
    .from('learner_profiles')
    .select('id, total_checkins_answered')
    .eq('user_id', user.id)
    .single()

  const totalCheckins = existing?.total_checkins_answered ?? 0
  const profileCompleteness = computeProfileCompleteness(updatedCtx, totalCheckins, !!existingProfile?.org_id || hasOrgContext)

  if (!existing) {
    const { error: insertErr } = await admin
      .from('learner_profiles')
      .insert({
        user_id: user.id,
        ai_tutor_context: updatedCtx,
        profile_completeness_pct: profileCompleteness,
      })
    if (insertErr) return NextResponse.json({ error: insertErr.message }, { status: 500 })
  } else {
    const { error } = await admin
      .from('learner_profiles')
      .update({
        ai_tutor_context: updatedCtx,
        profile_completeness_pct: profileCompleteness,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', user.id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  }

  await admin.from('learning_events').insert({
    user_id: user.id,
    event_type: 'profile_question_answered',
    payload: { source: 'preferences', profile_completeness_pct: profileCompleteness },
  })

  await evaluateGamification({
    userId: user.id,
    eventType: 'profile_question_answered',
    payload: { source: 'preferences', profile_completeness_pct: profileCompleteness },
    origin: request.nextUrl.origin,
    cookieHeader: request.headers.get('cookie') ?? '',
  })

  return NextResponse.json({
    ok: true,
    preferences: updatedPrefs,
    profile_completeness_pct: profileCompleteness,
  })
}

function hasValue(value: unknown): boolean {
  if (value === null || value === undefined) return false
  if (typeof value === 'string') return value.trim().length > 0
  if (Array.isArray(value)) return value.length > 0
  if (typeof value === 'object') return Object.keys(value as Record<string, unknown>).length > 0
  return true
}

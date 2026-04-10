import { createClient, createAdminClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import type { MascotId, MascotIntensity, MascotMode, MascotSupportStyle } from '@/types/mascot'

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

  const admin = createAdminClient()
  const { data: profile } = await admin
    .from('learner_profiles')
    .select('ai_tutor_context')
    .eq('user_id', user.id)
    .single()

  const ctx = (profile?.ai_tutor_context as Record<string, unknown>) ?? {}
  const prefs = (ctx.preferences as Record<string, string | null>) ?? {}
  return NextResponse.json({
    tts_voice: prefs.tts_voice ?? null,
    tutor_model: prefs.tutor_model ?? null,
    mascot_mode: prefs.mascot_mode ?? 'all',
    mascot_style: prefs.mascot_style ?? 'balanced',
    mascot_intensity: prefs.mascot_intensity ?? 'high',
    mascot_companions: Array.isArray(prefs.mascot_companions) ? prefs.mascot_companions : ['focus', 'memory', 'confidence'],
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
  const tts_voice = typeof body.tts_voice === 'string' ? body.tts_voice : undefined
  const tutor_model = typeof body.tutor_model === 'string' ? body.tutor_model : undefined
  const mascot_mode = MASCOT_MODES.includes(body.mascot_mode) ? (body.mascot_mode as MascotMode) : undefined
  const mascot_style = MASCOT_STYLES.includes(body.mascot_style) ? (body.mascot_style as MascotSupportStyle) : undefined
  const mascot_intensity = MASCOT_INTENSITIES.includes(body.mascot_intensity) ? (body.mascot_intensity as MascotIntensity) : undefined
  const mascot_companions = Array.isArray(body.mascot_companions)
    ? body.mascot_companions.filter((id: unknown): id is MascotId => typeof id === 'string' && MASCOT_IDS.includes(id as MascotId))
    : undefined
  if (
    tts_voice === undefined
    && tutor_model === undefined
    && mascot_mode === undefined
    && mascot_style === undefined
    && mascot_intensity === undefined
    && mascot_companions === undefined
  ) {
    return NextResponse.json({ error: 'Provide at least one valid preference value' }, { status: 400 })
  }

  const admin = createAdminClient()
  const { data: profile } = await admin
    .from('learner_profiles')
    .select('ai_tutor_context')
    .eq('user_id', user.id)
    .single()

  const ctx = (profile?.ai_tutor_context as Record<string, unknown>) ?? {}
  const existingPrefs = (ctx.preferences as Record<string, unknown>) ?? {}
  const updatedPrefs = {
    ...existingPrefs,
    ...(tts_voice !== undefined && { tts_voice }),
    ...(tutor_model !== undefined && { tutor_model }),
    ...(mascot_mode !== undefined && { mascot_mode }),
    ...(mascot_style !== undefined && { mascot_style }),
    ...(mascot_intensity !== undefined && { mascot_intensity }),
    ...(mascot_companions !== undefined && { mascot_companions }),
  }
  const updatedCtx = { ...ctx, preferences: updatedPrefs }

  const { data: existing } = await admin
    .from('learner_profiles')
    .select('id')
    .eq('user_id', user.id)
    .single()

  if (!existing) {
    const { error: insertErr } = await admin
      .from('learner_profiles')
      .insert({ user_id: user.id, ai_tutor_context: updatedCtx })
    if (insertErr) return NextResponse.json({ error: insertErr.message }, { status: 500 })
  } else {
    const { error } = await admin
      .from('learner_profiles')
      .update({ ai_tutor_context: updatedCtx, updated_at: new Date().toISOString() })
      .eq('user_id', user.id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  }
  return NextResponse.json({ ok: true, preferences: updatedPrefs })
}

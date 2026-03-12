import { createClient, createAdminClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

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
  if (tts_voice === undefined && tutor_model === undefined) {
    return NextResponse.json({ error: 'Provide tts_voice and/or tutor_model' }, { status: 400 })
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

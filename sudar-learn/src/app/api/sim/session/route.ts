import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceRoleSupabaseClient } from '@/lib/supabase/server'
import { createSimSessionRequestSchema } from '@shared-sudarsim/schemas'
import { createVoiceRoom, DEFAULT_PERSONA_STATE } from '@/lib/sim/simSession'

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ success: false, error: 'Invalid JSON' }, { status: 400 })
  }

  const parsed = createSimSessionRequestSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ success: false, error: parsed.error.flatten() }, { status: 400 })
  }

  const admin = createServiceRoleSupabaseClient()

  const { data: scenario, error: scenErr } = await admin
    .from('sim_scenarios')
    .select('*')
    .eq('id', parsed.data.scenario_id)
    .eq('status', 'published')
    .single()

  if (scenErr || !scenario) {
    return NextResponse.json({ success: false, error: 'Scenario not found' }, { status: 404 })
  }

  const { data: crmSkinRow } = await admin
    .from('sim_crm_skins')
    .select('image_url, width, height, overlays')
    .eq('scenario_id', scenario.id)
    .maybeSingle()

  const { data: profile } = await admin.from('profiles').select('org_id').eq('id', user.id).single()
  if (!profile?.org_id || profile.org_id !== scenario.org_id) {
    return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 })
  }

  const persona = scenario.persona as { initial_mood?: number } | null
  const initialMood = persona?.initial_mood ?? 0.5
  const personaState = {
    ...DEFAULT_PERSONA_STATE,
    mood: initialMood,
  }

  const { data: session, error: sessErr } = await admin
    .from('sim_sessions')
    .insert({
      org_id: scenario.org_id,
      scenario_id: scenario.id,
      user_id: user.id,
      module_id: parsed.data.module_id ?? null,
      course_id: parsed.data.course_id ?? null,
      enrollment_id: parsed.data.enrollment_id ?? null,
      persona_state: personaState,
      status: 'active',
    })
    .select('id')
    .single()

  if (sessErr || !session) {
    return NextResponse.json({ success: false, error: sessErr?.message ?? 'Session create failed' }, { status: 500 })
  }

  await admin.from('sim_transcripts').insert({ session_id: session.id, turns: [] })

  let voiceRoom = null
  try {
    voiceRoom = await createVoiceRoom(session.id, user.id, scenario.locale ?? 'en')
    if (voiceRoom?.room_name) {
      await admin.from('sim_sessions').update({ livekit_room: voiceRoom.room_name }).eq('id', session.id)
    }
  } catch {
    voiceRoom = { dev_ws_url: `/ws/session/${session.id}`, room_name: '', livekit_url: null, token: null }
  }

  const crmSkin = crmSkinRow ?? null

  return NextResponse.json({
    success: true,
    session_id: session.id,
    scenario: {
      id: scenario.id,
      title: scenario.title,
      locale: scenario.locale,
      persona: scenario.persona,
      channels: scenario.channels,
      channel_config: scenario.channel_config,
      rubric: scenario.rubric,
      completion_rule: scenario.completion_rule,
      compliance: scenario.compliance,
      crm_skin: crmSkin ?? null,
    },
    persona_state: personaState,
    voice: voiceRoom,
  })
}

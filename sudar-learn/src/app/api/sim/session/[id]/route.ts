import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceRoleSupabaseClient } from '@/lib/supabase/server'
import { simCrmActionRequestSchema, simTurnRequestSchema } from '@shared-sudarsim/schemas'
import { appendTurn, callIntelligenceSim } from '@/lib/sim/simSession'

type RouteParams = { params: Promise<{ id: string }> }

async function loadSession(sessionId: string, userId: string) {
  const admin = createServiceRoleSupabaseClient()
  const { data: session } = await admin
    .from('sim_sessions')
    .select('*, sim_scenarios(*)')
    .eq('id', sessionId)
    .eq('user_id', userId)
    .single()
  return { admin, session }
}

export async function GET(_request: NextRequest, { params }: RouteParams) {
  const { id } = await params
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })

  const { admin, session } = await loadSession(id, user.id)
  if (!session) return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 })

  const scenario = session.sim_scenarios as Record<string, unknown> | null
  let crmSkin = null
  if (scenario?.id) {
    const { data: skin } = await admin
      .from('sim_crm_skins')
      .select('image_url, width, height, overlays')
      .eq('scenario_id', scenario.id)
      .maybeSingle()
    crmSkin = skin
  }

  const { data: transcript } = await admin.from('sim_transcripts').select('turns').eq('session_id', id).single()
  const { data: result } = await admin.from('sim_rubric_results').select('*').eq('session_id', id).single()

  return NextResponse.json({
    success: true,
    session,
    scenario: scenario
      ? {
          id: scenario.id,
          title: scenario.title,
          locale: scenario.locale,
          persona: scenario.persona,
          channels: scenario.channels,
          channel_config: scenario.channel_config,
          rubric: scenario.rubric,
          completion_rule: scenario.completion_rule,
          compliance: scenario.compliance,
          crm_skin: crmSkin,
        }
      : null,
    transcript: transcript?.turns ?? [],
    rubric_result: result ?? null,
  })
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  const { id } = await params
  const supabase = await createClient()
  const {
    data: { user },
    data: { session: authSession },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })

  const url = new URL(request.url)
  const action = url.searchParams.get('action')

  const { admin, session } = await loadSession(id, user.id)
  if (!session || session.status !== 'active') {
    return NextResponse.json({ success: false, error: 'Session not active' }, { status: 400 })
  }

  if (action === 'turn') {
    const body = simTurnRequestSchema.parse(await request.json())
    const scenario = session.sim_scenarios as Record<string, unknown>
    const personaState = session.persona_state as { mood: number; difficulty: number; trust: number }

    const turnResult = await callIntelligenceSim<{
      reply: string
      persona_state: typeof personaState
    }>(
      '/persona/turn',
      {
        session_id: id,
        user_message: body.text,
        persona_state: personaState,
        scenario_id: session.scenario_id,
        locale: scenario.locale ?? 'en',
        channel: body.channel,
        scenario_context: { persona: scenario.persona, objectives: (scenario.persona as { objectives?: string[] })?.objectives },
      },
      authSession?.access_token,
    )

    const { data: tr } = await admin.from('sim_transcripts').select('turns').eq('session_id', id).single()
    const turns = appendTurn(appendTurn((tr?.turns as []) ?? [], { channel: body.channel, role: 'learner', text: body.text }), {
      channel: body.channel,
      role: 'customer',
      text: turnResult.reply,
    })

    await admin
      .from('sim_transcripts')
      .update({ turns, updated_at: new Date().toISOString() })
      .eq('session_id', id)
    await admin
      .from('sim_sessions')
      .update({
        persona_state: turnResult.persona_state,
        active_channel: body.channel,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)

    return NextResponse.json({ success: true, reply: turnResult.reply, persona_state: turnResult.persona_state })
  }

  if (action === 'crm') {
    const body = simCrmActionRequestSchema.parse(await request.json())
    const actions = [...((session.crm_actions as unknown[]) ?? []), body]
    await admin.from('sim_sessions').update({ crm_actions: actions }).eq('id', id)
    return NextResponse.json({ success: true })
  }

  if (action === 'complete') {
    const { data: tr } = await admin.from('sim_transcripts').select('turns').eq('session_id', id).single()
    const scenario = session.sim_scenarios as Record<string, unknown>
    const coach = await callIntelligenceSim<Record<string, unknown>>(
      '/coach/evaluate',
      {
        session_id: id,
        scenario,
        transcript: tr?.turns ?? [],
        crm_actions: session.crm_actions ?? [],
      },
      authSession?.access_token,
    )

    await admin.from('sim_rubric_results').upsert(
      {
        session_id: id,
        dimension_scores: coach.dimension_scores ?? {},
        overall_score: coach.overall_score ?? 0,
        coach_report: { narrative: coach.coach_narrative },
        replay_moments: coach.replay_moments ?? [],
        passed: coach.passed ?? false,
      },
      { onConflict: 'session_id' },
    )

    await admin
      .from('sim_sessions')
      .update({ status: 'completed', ended_at: new Date().toISOString() })
      .eq('id', id)

    const summary = `SudarSim: ${scenario.title} — score ${coach.overall_score}, ${coach.passed ? 'passed' : 'needs retry'}`
    await admin.from('ai_interactions').insert({
      user_id: user.id,
      course_id: session.course_id,
      module_id: session.module_id,
      query: 'sim_session_complete',
      response: summary,
      context: { sim_session_id: id, coach },
    })

    const ctxRow = await admin.from('learner_profiles').select('ai_tutor_context').eq('user_id', user.id).single()
    const ctx = (ctxRow.data?.ai_tutor_context as Record<string, unknown>) ?? {}
    const simCtx = (ctx.sim as Record<string, unknown>) ?? {}
    await admin
      .from('learner_profiles')
      .update({
        ai_tutor_context: {
          ...ctx,
          sim: {
            ...simCtx,
            last_session_id: id,
            last_score: coach.overall_score,
            weaknesses: coach.replay_moments ?? [],
          },
        },
      })
      .eq('user_id', user.id)

    return NextResponse.json({ success: true, coach })
  }

  return NextResponse.json({ success: false, error: 'Unknown action' }, { status: 400 })
}

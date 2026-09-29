import { NextRequest, NextResponse } from 'next/server'
import { ZodError } from 'zod'
import { createClient, createServiceRoleSupabaseClient } from '@/lib/supabase/server'
import {
  simCrmActionRequestSchema,
  simSyncTurnRequestSchema,
  simTurnRequestSchema,
  simVoiceEventRequestSchema,
  type SimTranscriptTurn,
  type SimTurnRequest,
} from '@shared-sudarsim/schemas'
import {
  appendTurn,
  buildScenarioContext,
  callIntelligenceSim,
  extractSttText,
  normalizeAudioMime,
  toPersonaHistory,
  type SimPersonaTurnResult,
  type SimSttResult,
} from '@/lib/sim/simSession'
import { verifySimServiceSecret } from '@/lib/sim/simInternalAuth'
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

async function loadSessionForAgent(sessionId: string) {
  const admin = createServiceRoleSupabaseClient()
  const { data: session } = await admin
    .from('sim_sessions')
    .select('*')
    .eq('id', sessionId)
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

  let voice = null
  if (session.livekit_room && session.status === 'active') {
    try {
      const { joinVoiceRoom } = await import('@/lib/sim/simSession')
      voice = await joinVoiceRoom(id, user.id, session.livekit_room as string)
    } catch {
      voice = null
    }
  }

  return NextResponse.json({
    success: true,
    session,
    voice,
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
  const url = new URL(request.url)
  const action = url.searchParams.get('action')
  const isAgentCall = verifySimServiceSecret(request.headers.get('x-sudar-sim-secret'))

  if (isAgentCall && (action === 'sync_turn' || action === 'voice_event')) {
    const { admin, session } = await loadSessionForAgent(id)
    if (!session || session.status !== 'active') {
      return NextResponse.json({ success: false, error: 'Session not active' }, { status: 400 })
    }

    if (action === 'sync_turn') {
      const body = simSyncTurnRequestSchema.parse(await request.json())
      const { data: tr } = await admin.from('sim_transcripts').select('turns').eq('session_id', id).single()
      let turns = (tr?.turns as SimTranscriptTurn[] | null) ?? []

      if (body.learner_text?.trim()) {
        turns = appendTurn(turns, { channel: body.channel, role: 'learner', text: body.learner_text.trim() })
      }
      if (body.customer_text?.trim()) {
        turns = appendTurn(turns, { channel: body.channel, role: 'customer', text: body.customer_text.trim() })
      }

      const updates: Record<string, unknown> = {
        updated_at: new Date().toISOString(),
        active_channel: body.channel,
      }
      if (body.persona_state) updates.persona_state = body.persona_state

      await admin.from('sim_transcripts').update({ turns, updated_at: new Date().toISOString() }).eq('session_id', id)
      await admin.from('sim_sessions').update(updates).eq('id', id)

      if (body.latency_ms != null) {
        await admin.from('learning_events').insert({
          user_id: session.user_id,
          event_type: 'sim_voice_turn',
          course_id: session.course_id,
          module_id: session.module_id,
          modality: 'sudarsim',
          payload: {
            session_id: id,
            latency_ms: body.latency_ms,
            channel: body.channel,
          },
        })
      }

      return NextResponse.json({ success: true, persona_state: body.persona_state ?? session.persona_state })
    }

    if (action === 'voice_event') {
      const body = simVoiceEventRequestSchema.parse(await request.json())
      await admin.from('learning_events').insert({
        user_id: session.user_id,
        event_type: 'sim_voice_event',
        course_id: session.course_id,
        module_id: session.module_id,
        modality: 'sudarsim',
        payload: { session_id: id, ...body },
      })
      return NextResponse.json({ success: true })
    }
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  const {
    data: { session: authSession },
  } = await supabase.auth.getSession()

  const { admin, session } = await loadSession(id, user.id)
  if (!session || session.status !== 'active') {
    return NextResponse.json({ success: false, error: 'Session not active' }, { status: 400 })
  }

  if (action === 'turn') {
    let body: SimTurnRequest
    try {
      body = simTurnRequestSchema.parse(await request.json())
    } catch (err) {
      if (err instanceof ZodError) {
        const message = err.issues.map((i) => i.message).join('; ') || 'Invalid request'
        return NextResponse.json({ success: false, error: message }, { status: 400 })
      }
      return NextResponse.json({ success: false, error: 'Invalid JSON' }, { status: 400 })
    }

    const scenario = session.sim_scenarios as Record<string, unknown>
    const personaState = session.persona_state as { mood: number; difficulty: number; trust: number }
    const locale = typeof scenario.locale === 'string' ? scenario.locale : 'en'
    const accessToken = authSession?.access_token

    const { data: tr } = await admin.from('sim_transcripts').select('turns').eq('session_id', id).single()
    const existingTurns = (tr?.turns as SimTranscriptTurn[] | null) ?? []
    const history = toPersonaHistory(existingTurns)
    const scenarioContext = buildScenarioContext(scenario)

    let learnerText = body.text?.trim() ?? ''

    if (body.audio_base64?.trim()) {
      try {
        // Intelligence SttJsonRequest: audio_base64, audio_mime?, locale?, user_id?
        const stt = await callIntelligenceSim<SimSttResult>(
          '/stt',
          {
            user_id: user.id,
            audio_base64: body.audio_base64,
            audio_mime: normalizeAudioMime(body.audio_mime),
            locale,
          },
          accessToken,
        )
        const transcribed = extractSttText(stt)
        if (!transcribed) {
          return NextResponse.json(
            { success: false, error: 'Could not transcribe audio. Try again or type your reply.' },
            { status: 422 },
          )
        }
        learnerText = transcribed
      } catch (err) {
        const message = err instanceof Error ? err.message : 'STT failed'
        return NextResponse.json(
          {
            success: false,
            error: `Voice transcription unavailable (${message}). Type your reply or retry when Intelligence STT is up.`,
          },
          { status: 503 },
        )
      }
    }

    if (!learnerText) {
      return NextResponse.json({ success: false, error: 'Empty message' }, { status: 400 })
    }

    const persona = scenario.persona as { voice_id?: string } | null | undefined
    const voiceOverride =
      typeof persona?.voice_id === 'string' && persona.voice_id.trim()
        ? persona.voice_id.trim()
        : undefined

    let turnResult: SimPersonaTurnResult
    try {
      turnResult = await callIntelligenceSim<SimPersonaTurnResult>(
        '/persona/turn',
        {
          session_id: id,
          user_id: user.id,
          user_message: learnerText,
          persona_state: personaState,
          scenario_id: session.scenario_id,
          locale,
          channel: body.channel,
          scenario_context: scenarioContext,
          history,
          ...(voiceOverride ? { voice: voiceOverride } : {}),
        },
        accessToken,
      )
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Persona turn failed'
      return NextResponse.json({ success: false, error: message }, { status: 502 })
    }

    const turns = appendTurn(
      appendTurn(existingTurns, { channel: body.channel, role: 'learner', text: learnerText }),
      {
        channel: body.channel,
        role: 'customer',
        text: turnResult.reply,
      },
    )

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

    return NextResponse.json({
      success: true,
      reply: turnResult.reply,
      persona_state: turnResult.persona_state,
      learner_text: learnerText,
      audio_base64: turnResult.audio_base64 ?? null,
      audio_mime: turnResult.audio_mime ?? null,
    })
  }

  if (action === 'crm') {
    const body = simCrmActionRequestSchema.parse(await request.json())
    const actions = [...((session.crm_actions as unknown[]) ?? []), body]
    await admin.from('sim_sessions').update({ crm_actions: actions }).eq('id', id)
    return NextResponse.json({ success: true })
  }

  if (action === 'complete') {
    const body = await request.json().catch(() => ({}))
    const reflection =
      typeof (body as { reflection?: unknown }).reflection === 'string'
        ? (body as { reflection: string }).reflection.trim()
        : ''

    const { data: tr } = await admin.from('sim_transcripts').select('turns').eq('session_id', id).single()
    const scenario = session.sim_scenarios as Record<string, unknown>
    const coach = await callIntelligenceSim<Record<string, unknown>>(
      '/coach/evaluate',
      {
        session_id: id,
        user_id: user.id,
        scenario,
        transcript: tr?.turns ?? [],
        crm_actions: session.crm_actions ?? [],
        learner_reflection: reflection || undefined,
      },
      authSession?.access_token,
    )

    await admin.from('sim_rubric_results').upsert(
      {
        session_id: id,
        dimension_scores: coach.dimension_scores ?? {},
        overall_score: coach.overall_score ?? 0,
        coach_report: {
          narrative: coach.coach_narrative,
          learner_reflection: reflection || null,
        },
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

    // Teaching OS: scenario claim_ids metadata → mastery
    try {
      const meta = (scenario.metadata as Record<string, unknown> | undefined) ?? {}
      const claimIds = Array.isArray(meta.claim_ids)
        ? (meta.claim_ids as unknown[]).filter((x): x is string => typeof x === 'string')
        : []
      const overall =
        typeof coach.overall_score === 'number'
          ? coach.overall_score > 1
            ? Math.min(1, coach.overall_score / 100)
            : coach.overall_score
          : coach.passed
            ? 0.8
            : 0.35
      if (claimIds.length) {
        const { recordClaimEvidence } = await import('@/lib/teaching/mastery')
        for (const claimId of claimIds.slice(0, 8)) {
          await recordClaimEvidence(admin, {
            userId: user.id,
            claimId,
            evidence_type: 'sim_coach',
            correct: Boolean(coach.passed),
            score: overall,
            courseId: session.course_id != null ? String(session.course_id) : null,
            moduleId: session.module_id != null ? String(session.module_id) : null,
            modality: 'sudarsim',
          })
        }
      }
    } catch {
      /* optional until claims linked */
    }

    return NextResponse.json({ success: true, coach })
  }

  return NextResponse.json({ success: false, error: 'Unknown action' }, { status: 400 })
}

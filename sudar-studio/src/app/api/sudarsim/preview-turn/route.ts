import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { z, ZodError } from 'zod'
import {
  buildScenarioContext,
  callIntelligenceSim,
  normalizeAudioMime,
  type SimPersonaState,
  type SimPersonaTurnResult,
  type SimVoiceTurnResult,
} from '@/lib/sudarsim/intelligenceSim'

const historyTurnSchema = z.object({
  role: z.enum(['learner', 'customer', 'system']),
  text: z.string(),
})

const previewTurnSchema = z
  .object({
    scenario: z.record(z.string(), z.unknown()),
    persona_state: z.object({
      mood: z.number().min(0).max(1),
      difficulty: z.number().min(0).max(1),
      trust: z.number().min(0).max(1),
    }),
    channel: z.enum(['phone', 'chat', 'email']).default('phone'),
    history: z.array(historyTurnSchema).default([]),
    text: z.string().optional(),
    audio_base64: z.string().min(1).optional(),
    audio_mime: z.string().optional(),
  })
  .refine((v) => Boolean(v.text?.trim()) || Boolean(v.audio_base64?.trim()), {
    message: 'Either text or audio_base64 is required',
  })

function formatZodError(err: ZodError): string {
  return err.issues.map((i) => `${i.path.join('.') || 'body'}: ${i.message}`).join('; ') || 'Invalid request'
}

/** In-Studio preview: no Supabase sim_sessions — stateless turn loop for authoring QA. */
export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })

  let raw: unknown
  try {
    raw = await request.json()
  } catch {
    return NextResponse.json({ success: false, error: 'Request body is not valid JSON' }, { status: 400 })
  }

  let body: z.infer<typeof previewTurnSchema>
  try {
    body = previewTurnSchema.parse(raw)
  } catch (err) {
    if (err instanceof ZodError) {
      return NextResponse.json({ success: false, error: formatZodError(err) }, { status: 400 })
    }
    return NextResponse.json({ success: false, error: 'Invalid request' }, { status: 400 })
  }

  const scenario = body.scenario
  const locale = typeof scenario.locale === 'string' ? scenario.locale : 'en'
  const scenarioContext = buildScenarioContext(scenario)
  const persona = scenario.persona as { voice_id?: string } | null | undefined
  const voiceOverride =
    typeof persona?.voice_id === 'string' && persona.voice_id.trim()
      ? persona.voice_id.trim()
      : undefined
  const history = body.history.filter((h) => h.role !== 'system')
  const voicePayload = voiceOverride ? { voice: voiceOverride } : {}

  if (body.audio_base64?.trim()) {
    try {
      const voiceTurn = await callIntelligenceSim<SimVoiceTurnResult>('/voice-turn', {
        audio_base64: body.audio_base64,
        audio_mime: normalizeAudioMime(body.audio_mime),
        locale,
        channel: body.channel,
        persona_state: body.persona_state,
        scenario_context: scenarioContext,
        history,
        ...voicePayload,
      })

      return NextResponse.json({
        success: true,
        reply: voiceTurn.reply,
        persona_state: voiceTurn.persona_state as SimPersonaState,
        learner_text: voiceTurn.learner_text,
        audio_base64: voiceTurn.audio_base64 ?? null,
        audio_mime: voiceTurn.audio_mime ?? null,
      })
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Voice turn failed'
      return NextResponse.json(
        { success: false, error: `Voice transcription unavailable (${message}). Type your reply instead.` },
        { status: 503 },
      )
    }
  }

  const learnerText = body.text?.trim() ?? ''
  if (!learnerText) {
    return NextResponse.json({ success: false, error: 'Empty message' }, { status: 400 })
  }

  try {
    const turnResult = await callIntelligenceSim<SimPersonaTurnResult>('/persona/turn', {
      session_id: 'studio-preview',
      user_message: learnerText,
      persona_state: body.persona_state,
      locale,
      channel: body.channel,
      scenario_context: scenarioContext,
      history,
      ...voicePayload,
    })

    return NextResponse.json({
      success: true,
      reply: turnResult.reply,
      persona_state: turnResult.persona_state as SimPersonaState,
      learner_text: learnerText,
      audio_base64: turnResult.audio_base64 ?? null,
      audio_mime: turnResult.audio_mime ?? null,
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Turn failed'
    return NextResponse.json({ success: false, error: message }, { status: 502 })
  }
}

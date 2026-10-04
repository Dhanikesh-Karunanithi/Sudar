/**
 * SudarSim — session helpers for Learn BFF
 */
import type { SimPersonaState, SimScenario, SimTranscriptTurn } from '@shared-sudarsim/schemas'

export const SUDAR_SIM_URL = (process.env.SUDAR_SIM_URL ?? 'http://localhost:8090').replace(/\/$/, '')
export const INTELLIGENCE_URL = (
  process.env.SUDAR_INTELLIGENCE_URL ?? process.env.BYTEOS_INTELLIGENCE_URL ?? 'http://localhost:8001'
).replace(/\/$/, '')

export const DEFAULT_PERSONA_STATE: SimPersonaState = {
  mood: 0.5,
  difficulty: 0.5,
  trust: 0.5,
}

function clamp01(n: number): number {
  if (Number.isNaN(n)) return 0.5
  return Math.min(1, Math.max(0, n))
}

/**
 * Resolve starting persona state from scenario JSON.
 * Prefer `persona_state_rules.initial_state`, then `persona.initial_mood`.
 */
export function initialPersonaStateFromScenario(scenario: {
  persona?: unknown
  persona_state_rules?: unknown
}): SimPersonaState {
  const rules = scenario.persona_state_rules as
    | { initial_state?: Partial<SimPersonaState> }
    | null
    | undefined
  const initial = rules?.initial_state
  const persona = scenario.persona as { initial_mood?: number } | null | undefined
  const mood =
    typeof initial?.mood === 'number'
      ? initial.mood
      : typeof persona?.initial_mood === 'number'
        ? persona.initial_mood
        : DEFAULT_PERSONA_STATE.mood
  const trust =
    typeof initial?.trust === 'number' ? initial.trust : DEFAULT_PERSONA_STATE.trust
  const difficulty =
    typeof initial?.difficulty === 'number'
      ? initial.difficulty
      : DEFAULT_PERSONA_STATE.difficulty
  return {
    mood: clamp01(mood),
    trust: clamp01(trust),
    difficulty: clamp01(difficulty),
  }
}

export type SimPersonaTurnResult = {
  reply: string
  persona_state: SimPersonaState
  audio_hint?: string | null
  audio_base64?: string | null
  audio_mime?: string | null
}

/** Intelligence `/api/sim/stt` — `{ success: true, text }` (also tolerate transcript alias). */
export type SimSttResult = {
  success?: boolean
  text?: string
  transcript?: string
}

export function appendTurn(
  turns: SimTranscriptTurn[],
  turn: Omit<SimTranscriptTurn, 'ts'> & { ts?: string },
): SimTranscriptTurn[] {
  return [
    ...turns,
    {
      ...turn,
      ts: turn.ts ?? new Date().toISOString(),
    },
  ]
}

/** Build scenario_context for Intelligence persona / STT-TTS turns. */
export function buildScenarioContext(scenario: Record<string, unknown>): Record<string, unknown> {
  const persona = (scenario.persona as Record<string, unknown> | null) ?? {}
  const objectives = Array.isArray(persona.objectives)
    ? (persona.objectives as unknown[]).filter((x): x is string => typeof x === 'string')
    : []
  return {
    persona,
    objectives,
    title: scenario.title,
    locale: scenario.locale,
    channels: scenario.channels,
    channel_config: scenario.channel_config,
  }
}

/** Normalize STT payloads from Intelligence (`{ success, text }` or transcript alias). */
export function extractSttText(result: SimSttResult): string {
  if (result.success === false) return ''
  return (result.text ?? result.transcript ?? '').trim()
}

/**
 * History for Intelligence persona turn.
 * Roles stay as transcript values (`learner` | `customer` | `system`);
 * Intelligence maps learner→user and customer→assistant.
 */
export function toPersonaHistory(turns: SimTranscriptTurn[]): Array<{
  role: SimTranscriptTurn['role']
  text: string
}> {
  return turns
    .filter((t) => Boolean(t.text?.trim()) && t.role !== 'system')
    .map((t) => ({
      role: t.role,
      text: t.text.trim(),
    }))
}

/** Strip codec params so STT Content-Type is a bare mime (e.g. audio/webm). */
export function normalizeAudioMime(mime: string | null | undefined, fallback = 'audio/webm'): string {
  const raw = (mime ?? fallback).trim() || fallback
  return raw.split(';')[0]?.trim() || fallback
}

export type SimSessionRow = {
  id: string
  org_id: string
  scenario_id: string
  user_id: string
  module_id: string | null
  course_id: string | null
  enrollment_id: string | null
  status: string
  persona_state: SimPersonaState
  active_channel: string
  livekit_room: string | null
  crm_actions: unknown[]
  started_at: string
  ended_at: string | null
}

export type SimScenarioRow = SimScenario & {
  id: string
  org_id: string
  crm_skin?: {
    image_url: string
    width: number
    height: number
    overlays: unknown[]
  }
}

export async function callIntelligenceSim<T>(
  path: string,
  body: unknown,
  accessToken?: string | null,
): Promise<T> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  const secret = process.env.INTELLIGENCE_SERVICE_SECRET?.trim()
  // BFF already validated the learner session — prefer service secret so Intelligence
  // does not require SUPABASE_JWT_SECRET for every sim turn.
  if (secret) {
    headers['X-Intelligence-Service-Secret'] = secret
  } else if (accessToken) {
    headers.Authorization = `Bearer ${accessToken}`
  }

  const res = await fetch(`${INTELLIGENCE_URL}/api/sim${path}`, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  })
  if (!res.ok) {
    let detail = await res.text()
    try {
      const parsed = JSON.parse(detail) as { detail?: string | unknown }
      if (typeof parsed.detail === 'string') detail = parsed.detail
    } catch {
      /* keep raw */
    }
    throw new Error(detail || res.statusText)
  }
  return res.json() as Promise<T>
}

export async function createVoiceRoom(sessionId: string, userId: string, locale: string) {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  const simSecret = process.env.SUDAR_SIM_SERVICE_SECRET?.trim()
  if (simSecret) headers['X-Sudar-Sim-Secret'] = simSecret

  const res = await fetch(`${SUDAR_SIM_URL}/rooms`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ session_id: sessionId, user_id: userId, locale }),
  })
  if (!res.ok) throw new Error(await res.text())
  return res.json() as Promise<{
    room_name: string
    livekit_url: string | null
    token: string | null
    dev_ws_url: string | null
    agent_dispatched?: boolean
  }>
}

export async function joinVoiceRoom(sessionId: string, userId: string, roomName: string) {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  const simSecret = process.env.SUDAR_SIM_SERVICE_SECRET?.trim()
  if (simSecret) headers['X-Sudar-Sim-Secret'] = simSecret

  const res = await fetch(`${SUDAR_SIM_URL}/rooms/join`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ session_id: sessionId, user_id: userId, room_name: roomName }),
  })
  if (!res.ok) throw new Error(await res.text())
  return res.json() as Promise<{
    room_name: string
    livekit_url: string | null
    token: string | null
  }>
}

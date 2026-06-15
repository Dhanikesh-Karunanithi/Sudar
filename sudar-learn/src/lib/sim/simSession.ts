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
  if (accessToken) headers.Authorization = `Bearer ${accessToken}`
  if (secret) headers['X-Intelligence-Service-Secret'] = secret

  const res = await fetch(`${INTELLIGENCE_URL}/api/sim${path}`, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  })
  if (!res.ok) {
    const detail = await res.text()
    throw new Error(detail || res.statusText)
  }
  return res.json() as Promise<T>
}

export async function createVoiceRoom(sessionId: string, userId: string, locale: string) {
  const res = await fetch(`${SUDAR_SIM_URL}/rooms`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ session_id: sessionId, user_id: userId, locale }),
  })
  if (!res.ok) throw new Error(await res.text())
  return res.json() as Promise<{
    room_name: string
    livekit_url: string | null
    token: string | null
    dev_ws_url: string | null
  }>
}

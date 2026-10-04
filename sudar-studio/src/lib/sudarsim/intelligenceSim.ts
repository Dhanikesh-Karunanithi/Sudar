/**
 * Studio → Sudar Intelligence (SudarSim preview / authoring).
 * Uses service secret; no learner JWT required.
 */

export const INTELLIGENCE_URL = (
  process.env.SUDAR_INTELLIGENCE_URL ?? process.env.BYTEOS_INTELLIGENCE_URL ?? 'http://localhost:8001'
).replace(/\/$/, '')

export type SimPersonaState = { mood: number; difficulty: number; trust: number }

export type SimPersonaTurnResult = {
  reply: string
  persona_state: SimPersonaState
  audio_base64?: string | null
  audio_mime?: string | null
}

export type SimSttResult = { success?: boolean; text?: string }

export type SimVoiceTurnResult = {
  learner_text: string
  reply: string
  persona_state: SimPersonaState
  audio_base64?: string | null
  audio_mime?: string | null
}

export type SimTtsResult = {
  audio_base64?: string | null
  audio_mime?: string | null
}

export async function callIntelligenceSim<T>(path: string, body: unknown): Promise<T> {
  const secret = process.env.INTELLIGENCE_SERVICE_SECRET?.trim()
  if (!secret) {
    throw new Error(
      'Studio missing INTELLIGENCE_SERVICE_SECRET. Add it to sudar-studio/.env.local (same value as sudar-intelligence/.env.local) and restart Studio (npm run dev).',
    )
  }

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'X-Intelligence-Service-Secret': secret,
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

export function normalizeAudioMime(mime: string | null | undefined, fallback = 'audio/webm'): string {
  const raw = (mime ?? fallback).trim() || fallback
  return raw.split(';')[0]?.trim() || fallback
}

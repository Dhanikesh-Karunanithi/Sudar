import type { SimPersonaState } from '@/types/sudarsim'

/** Strip DB-only fields and keep JSON-safe scenario for preview API. */
export function sanitizeScenarioForPreview(scenario: Record<string, unknown>): Record<string, unknown> {
  const {
    id: _id,
    org_id: _orgId,
    created_by: _createdBy,
    created_at: _createdAt,
    updated_at: _updatedAt,
    ...rest
  } = scenario
  return JSON.parse(JSON.stringify(rest)) as Record<string, unknown>
}

export type PreviewTurnPayload = {
  scenario: Record<string, unknown>
  persona_state: SimPersonaState
  channel: 'phone' | 'chat' | 'email'
  history: Array<{ role: 'learner' | 'customer' | 'system'; text: string }>
  text?: string
  audio_base64?: string
  audio_mime?: string
}

export function buildPreviewTurnPayload(input: {
  scenario: Record<string, unknown>
  persona_state: SimPersonaState
  channel: 'phone' | 'chat' | 'email'
  history: Array<{ role: 'learner' | 'customer'; text: string }>
  text?: string
  audio_base64?: string
  audio_mime?: string
}): PreviewTurnPayload {
  return {
    scenario: sanitizeScenarioForPreview(input.scenario),
    persona_state: input.persona_state,
    channel: input.channel,
    history: input.history.map((h) => ({ role: h.role, text: h.text })),
    ...(input.text?.trim() ? { text: input.text.trim() } : {}),
    ...(input.audio_base64?.trim()
      ? { audio_base64: input.audio_base64, audio_mime: input.audio_mime ?? 'audio/webm' }
      : {}),
  }
}

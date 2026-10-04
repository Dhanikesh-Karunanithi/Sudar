import { describe, expect, it } from 'vitest'
import {
  simScenarioSchema,
  simCrmSkinSchema,
  simPersonaStateSchema,
  personaTurnResponseSchema,
  simSttResponseSchema,
  simTurnRequestSchema,
} from './schemas'

describe('simScenarioSchema', () => {
  it('parses minimal scenario', () => {
    const parsed = simScenarioSchema.parse({
      title: 'Billing escalation',
      persona: { name: 'Alex', backstory: 'Frustrated customer' },
      rubric: {
        dimensions: [{ id: 'empathy', label: 'Empathy', weight: 0.3, must_pass: true }],
      },
    })
    expect(parsed.locale).toBe('en')
    expect(parsed.channels.phone).toBe(true)
  })
})

describe('simCrmSkinSchema', () => {
  it('parses overlay coordinates', () => {
    const skin = simCrmSkinSchema.parse({
      image_url: 'https://example.com/crm.png',
      overlays: [{ id: 'n1', type: 'textarea', x: 0.1, y: 0.2, w: 0.3, h: 0.1, label: 'Notes' }],
    })
    expect(skin.overlays).toHaveLength(1)
  })
})

describe('personaTurnResponseSchema', () => {
  it('roundtrips persona state', () => {
    const state = simPersonaStateSchema.parse({ mood: 0.4, difficulty: 0.6, trust: 0.3 })
    const res = personaTurnResponseSchema.parse({ reply: 'Hello', persona_state: state })
    expect(res.persona_state.trust).toBe(0.3)
  })

  it('accepts optional TTS audio fields', () => {
    const res = personaTurnResponseSchema.parse({
      reply: 'Hello',
      persona_state: { mood: 0.5, difficulty: 0.5, trust: 0.5 },
      audio_base64: 'abc',
      audio_mime: 'audio/mpeg',
    })
    expect(res.audio_mime).toBe('audio/mpeg')
  })

  it('accepts null TTS fields when Edge-TTS fails', () => {
    const res = personaTurnResponseSchema.parse({
      reply: 'Hello',
      persona_state: { mood: 0.5, difficulty: 0.5, trust: 0.5 },
      audio_base64: null,
      audio_mime: null,
      audio_hint: null,
    })
    expect(res.audio_base64).toBeNull()
    expect(res.audio_mime).toBeNull()
  })
})

describe('simSttResponseSchema', () => {
  it('accepts Intelligence success envelope', () => {
    const parsed = simSttResponseSchema.parse({ success: true, text: 'I need a refund' })
    expect(parsed.text).toBe('I need a refund')
  })
})

describe('simTurnRequestSchema', () => {
  it('accepts text-only turns', () => {
    const parsed = simTurnRequestSchema.parse({ channel: 'chat', text: 'How can I help?' })
    expect(parsed.text).toBe('How can I help?')
  })

  it('accepts audio-only phone turns', () => {
    const parsed = simTurnRequestSchema.parse({
      channel: 'phone',
      audio_base64: 'AAAA',
      audio_mime: 'audio/webm',
    })
    expect(parsed.audio_base64).toBe('AAAA')
  })

  it('rejects empty turn payloads', () => {
    expect(() => simTurnRequestSchema.parse({ channel: 'phone' })).toThrow()
  })
})

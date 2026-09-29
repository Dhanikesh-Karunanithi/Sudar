import { describe, expect, it } from 'vitest'
import {
  personaTurnResponseSchema,
  simSttResponseSchema,
  simTurnRequestSchema,
} from '@shared-sudarsim/schemas'
import { extractSttText, normalizeAudioMime, toPersonaHistory } from './simSession'

describe('Voice MVP contracts', () => {
  it('parses Intelligence STT envelope', () => {
    const parsed = simSttResponseSchema.parse({ success: true, text: 'I need a refund' })
    expect(extractSttText(parsed)).toBe('I need a refund')
  })

  it('accepts null TTS on persona response', () => {
    const res = personaTurnResponseSchema.parse({
      reply: 'Hello',
      persona_state: { mood: 0.5, difficulty: 0.5, trust: 0.5 },
      audio_base64: null,
      audio_mime: null,
    })
    expect(res.audio_base64).toBeNull()
  })

  it('accepts audio-only turn request', () => {
    const parsed = simTurnRequestSchema.parse({
      channel: 'phone',
      audio_base64: 'AAAA',
      audio_mime: 'audio/webm;codecs=opus',
    })
    expect(normalizeAudioMime(parsed.audio_mime)).toBe('audio/webm')
  })

  it('maps transcript history to slim persona roles', () => {
    const hist = toPersonaHistory([
      { ts: 't1', channel: 'phone', role: 'learner', text: 'Hi' },
      { ts: 't2', channel: 'phone', role: 'customer', text: 'Hello' },
      { ts: 't3', channel: 'phone', role: 'system', text: 'skip me' },
    ])
    expect(hist).toEqual([
      { role: 'learner', text: 'Hi' },
      { role: 'customer', text: 'Hello' },
    ])
  })
})

import { describe, expect, it } from 'vitest'
import {
  simScenarioSchema,
  simCrmSkinSchema,
  simPersonaStateSchema,
  personaTurnResponseSchema,
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
})

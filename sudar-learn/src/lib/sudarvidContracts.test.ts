import { describe, expect, it } from 'vitest'
import {
  normalizeEngineMode,
  normalizeInteractionType,
  summarizeManifestInteractions,
} from '@/lib/sudarvidContracts'

describe('sudarvid contract helpers', () => {
  it('normalizes engine mode with classic fallback', () => {
    expect(normalizeEngineMode('premium')).toBe('premium')
    expect(normalizeEngineMode('classic')).toBe('classic')
    expect(normalizeEngineMode('unknown')).toBe('classic')
  })

  it('normalizes manifest interaction types for premium schema', () => {
    expect(normalizeInteractionType('reflect')).toBe('reflect')
    expect(normalizeInteractionType('decision')).toBe('decision')
    expect(normalizeInteractionType('checkpoint')).toBe('checkpoint')
    expect(normalizeInteractionType('other')).toBe('none')
    expect(normalizeInteractionType(undefined)).toBe('none')
  })

  it('summarizes interaction counts without throwing on unknown rows', () => {
    const summary = summarizeManifestInteractions([
      { scene_number: 1, interaction_type: 'reflect' },
      { scene_number: 2, interaction_type: 'decision' },
      { scene_number: 3, interaction_type: 'surprise' },
      null,
    ])
    expect(summary.total_slides).toBe(4)
    expect(summary.interaction_counts.reflect).toBe(1)
    expect(summary.interaction_counts.decision).toBe(1)
    expect(summary.interaction_counts.none).toBe(2)
  })
})

import { describe, expect, it } from 'vitest'
import { buildGuardrailSessionContext } from '@/lib/tutor/guardrailSessionContext'

describe('buildGuardrailSessionContext', () => {
  it('returns empty for missing history', () => {
    expect(buildGuardrailSessionContext(undefined)).toBe('')
    expect(buildGuardrailSessionContext([])).toBe('')
  })

  it('formats recent turns compactly', () => {
    const ctx = buildGuardrailSessionContext([
      { role: 'user', content: 'Teach me GitHub' },
      { role: 'assistant', content: 'Which part?' },
      { role: 'user', content: 'All basics' },
    ])
    expect(ctx).toContain('Learner: Teach me GitHub')
    expect(ctx).toContain('Tutor: Which part?')
    expect(ctx).toContain('Learner: All basics')
  })
})

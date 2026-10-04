import { describe, expect, it } from 'vitest'
import { applyEvidenceToMastery } from '@/lib/teaching/mastery'
import { recommendPedagogyMode, runPedagogyEngine } from '@/lib/teaching/pedagogyEngine'
import { emptyLearningSessionState } from '@/types/teaching'

describe('applyEvidenceToMastery', () => {
  it('raises p_know on correct evidence', () => {
    const next = applyEvidenceToMastery(null, 'u1', 'c1', {
      evidence_type: 'quiz',
      correct: true,
      score: 0.9,
    })
    expect(next.p_know).toBeGreaterThan(0.3)
    expect(next.next_review_at).toBeTruthy()
    expect(next.repetitions).toBeGreaterThan(0)
  })

  it('lowers p_know on failed evidence', () => {
    const base = applyEvidenceToMastery(null, 'u1', 'c1', {
      evidence_type: 'quiz',
      correct: true,
    })
    const next = applyEvidenceToMastery(base, 'u1', 'c1', {
      evidence_type: 'quiz',
      correct: false,
    })
    expect(next.p_know).toBeLessThan(base.p_know)
    expect(next.streak).toBe(0)
  })
})

describe('pedagogyEngine', () => {
  it('stays in intake until goal is set', () => {
    const session = emptyLearningSessionState()
    expect(recommendPedagogyMode(session, 'Teach me privacy')).toBe('intake')
  })

  it('schedules check after enough turns', () => {
    const session = emptyLearningSessionState()
    session.intake_complete = true
    session.working_memory.goal = 'Privacy basics'
    session.turns_since_check = 3
    session.substantive_turn_count = 4
    const out = runPedagogyEngine({
      twin: {},
      session,
      active_claims: [
        {
          id: '00000000-0000-4000-8000-000000000001',
          domain_id: 'd1',
          stem: 'Consent must be freely given',
          misconceptions: ['Consent can be assumed from silence'],
          bloom: 'understand',
          evidence_types: ['explain_back', 'catch_error'],
          metadata: {},
          sort_order: 0,
        },
      ],
      user_message: 'ok continue',
    })
    expect(out.mode).toBe('check')
    expect(out.check_spec?.prompt).toBeTruthy()
  })
})

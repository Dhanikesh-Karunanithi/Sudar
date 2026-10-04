import { describe, expect, it } from 'vitest'
import { parseSudarNotesModelOutput, isSudarNotesRoute } from '@/lib/sudarNotes/turnContract'
import { recommendSudarNotesMode, applySudarNotesTurnToSession } from '@/lib/sudarNotes/turnEngine'
import { emptySudarNotesSession } from '@/types/sudarNotes'

describe('parseSudarNotesModelOutput', () => {
  it('parses chat + SUDAR_NOTES json', () => {
    const raw = `What is your experience level with LMS design?

SUDAR_NOTES: {"mode":"intake","working_memory_patch":{"goal":"LMS pedagogy","open_questions":["Experience?"]},"note_ops":[],"check":null,"next_hint":"teach one idea"}`
    const out = parseSudarNotesModelOutput(raw)
    expect(out.chatMarkdown).toContain('experience level')
    expect(out.turn?.mode).toBe('intake')
    expect(out.turn?.working_memory_patch?.goal).toBe('LMS pedagogy')
    expect(out.malformed).toBe(false)
  })

  it('marks malformed when JSON invalid', () => {
    const out = parseSudarNotesModelOutput('Hello\n\nSUDAR_NOTES: {not json')
    expect(out.chatMarkdown).toBe('Hello')
    expect(out.turn).toBeNull()
    expect(out.malformed).toBe(true)
  })
})

describe('isSudarNotesRoute', () => {
  it('detects journey and notes', () => {
    expect(isSudarNotesRoute('/journey')).toBe(true)
    expect(isSudarNotesRoute('/notes')).toBe(true)
    expect(isSudarNotesRoute('/courses/x')).toBe(false)
  })
})

describe('recommendSudarNotesMode', () => {
  it('forces intake until goal set', () => {
    const s = emptySudarNotesSession()
    expect(recommendSudarNotesMode(s, 'Teach me pedagogy')).toBe('intake')
  })

  it('forces check after cadence', () => {
    const s = {
      ...emptySudarNotesSession(),
      intake_complete: true,
      working_memory: {
        ...emptySudarNotesSession().working_memory,
        goal: 'LMS pedagogy',
      },
      turns_since_check: 3,
      substantive_turn_count: 4,
      mode: 'teach' as const,
    }
    expect(recommendSudarNotesMode(s, 'ok continue')).toBe('check')
  })
})

describe('applySudarNotesTurnToSession', () => {
  it('merges goal and resets check counter', () => {
    const s = emptySudarNotesSession()
    const next = applySudarNotesTurnToSession(
      s,
      {
        mode: 'check',
        working_memory_patch: { goal: 'Pedagogy' },
        check: { type: 'explain_back', prompt: 'Explain in one sentence' },
      },
      { hadSoftCheck: true },
    )
    expect(next.working_memory.goal).toBe('Pedagogy')
    expect(next.turns_since_check).toBe(0)
    expect(next.intake_complete).toBe(true)
  })
})

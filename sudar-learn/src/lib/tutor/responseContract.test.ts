import { describe, expect, it } from 'vitest'
import {
  parseTutorActionsFromText,
  sanitizeActions,
  validateTutorQueryResponsePayload,
} from '@/lib/tutor/responseContract'

describe('parseTutorActionsFromText', () => {
  it('parses ACTIONS payload and strips it from visible text', () => {
    const parsed = parseTutorActionsFromText(
      'Your next step is this course.\nACTIONS: [{"type":"open_course","course_id":"123e4567-e89b-12d3-a456-426614174000","label":"Continue"}]',
    )

    expect(parsed.text).toBe('Your next step is this course.')
    expect(parsed.rawActions).toHaveLength(1)
    expect(parsed.malformedActions).toBe(false)
  })

  it('flags malformed action JSON and preserves readable response text', () => {
    const parsed = parseTutorActionsFromText('Here you go.\nACTIONS: [{"type":"open_course"]')
    expect(parsed.text).toBe('Here you go.')
    expect(parsed.rawActions).toEqual([])
    expect(parsed.malformedActions).toBe(true)
  })
})

describe('validateTutorQueryResponsePayload', () => {
  it('rejects malformed payloads with a safe error', () => {
    const data = validateTutorQueryResponsePayload({ response: 42 })
    expect(data.error).toBe('Invalid response from tutor.')
  })

  it('keeps valid payloads', () => {
    const data = validateTutorQueryResponsePayload({
      response: 'Completed answer',
      actions: [{ type: 'open_path', label: 'Open path', href: '/paths/abc' }],
      blocks: [{ id: 'text-1', type: 'text', payload: { content: 'Completed answer' } }],
    })
    expect(data.response).toBe('Completed answer')
    expect(data.actions?.[0]?.type).toBe('open_path')
  })
})

describe('sanitizeActions', () => {
  it('removes invalid actions and keeps safe entries', () => {
    const actions = sanitizeActions([
      { type: 'open_course', label: 'Continue', href: '/courses/abc' },
      { type: 'open_path', label: '', href: 'javascript:alert(1)' } as unknown as never,
    ])
    expect(actions).toHaveLength(1)
    expect(actions[0]?.label).toBe('Continue')
  })
})


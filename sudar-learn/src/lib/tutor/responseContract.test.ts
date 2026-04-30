import { describe, expect, it } from 'vitest'
import {
  parseTutorActionsFromText,
  parseTutorBlocksFromText,
  parseTutorModelOutput,
  sanitizeActions,
  validateTutorQueryResponsePayload,
} from '@/lib/tutor/responseContract'
import { sanitizeTutorBlock, sanitizeTutorBlocks } from '@/lib/tutor/tutorBlockSanitize'

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

describe('parseTutorBlocksFromText', () => {
  it('strips BLOCKS json from visible text', () => {
    const raw =
      'Here is the answer.\n\nBLOCKS: [{"id":"c1","type":"choice_group","payload":{"choices":[{"id":"a","label":"More","follow_up_message":"Tell me more."}]}}]'
    const p = parseTutorBlocksFromText(raw)
    expect(p.text).toBe('Here is the answer.')
    expect(p.rawBlocks).toHaveLength(1)
  })
})

describe('parseTutorModelOutput', () => {
  it('strips ACTIONS then BLOCKS in order', () => {
    const raw = `Text answer
BLOCKS: [{"id":"x","type":"concept_card","payload":{"title":"T","key_idea":"K"}}]
ACTIONS: [{"type":"open_course","course_id":"123e4567-e89b-12d3-a456-426614174000","label":"Go"}]`
    const out = parseTutorModelOutput(raw)
    expect(out.text).toContain('Text answer')
    expect(out.rawBlocks.length).toBeGreaterThan(0)
    expect(out.rawActions.length).toBeGreaterThan(0)
  })
})

describe('sanitizeTutorBlock', () => {
  it('rejects non-https media URLs', () => {
    const b = sanitizeTutorBlock({
      id: 'm1',
      type: 'media_card',
      payload: {
        title: 'x',
        link_url: 'javascript:alert(1)',
        image_url: 'http://evil.com/x.png',
      },
    })
    expect(b).not.toBeNull()
    expect((b?.payload as { link_url?: string }).link_url).toBeUndefined()
  })

  it('keeps valid choice_group with normalized follow-ups', () => {
    const b = sanitizeTutorBlock({
      id: 'g1',
      type: 'choice_group',
      payload: {
        question: 'Next?',
        choices: [{ id: 'a', label: 'Opt A' }],
      },
    })
    expect(b?.type).toBe('choice_group')
    const p = b?.payload as { choices: Array<{ follow_up_message: string }> }
    expect(p.choices[0]?.follow_up_message).toBe('Opt A')
  })

  it('rejects unknown interactive component ids', () => {
    const b = sanitizeTutorBlock({
      id: 'i1',
      type: 'interactive_demo',
      payload: { component_id: 'arbitrary_hack' },
    })
    expect(b).toBeNull()
  })
})

describe('sanitizeTutorBlocks', () => {
  it('filters invalid blocks in a batch', () => {
    const out = sanitizeTutorBlocks([
      { id: 't1', type: 'text', payload: { content: 'ok' } },
      { id: 'bad', type: 'not_a_real_type', payload: {} },
    ])
    expect(out).toHaveLength(1)
    expect(out[0]?.id).toBe('t1')
  })
})


import { describe, it, expect } from 'vitest'
import { z } from 'zod'

/** Mirrors ALP Learn JSON contracts (see docs/ALP_API.md). UUIDs are syntactically valid only. */
const eventsRequest = z.object({
  user_id: z.string().uuid(),
  events: z
    .array(
      z.object({
        event_type: z.string().min(1),
        course_id: z.string().uuid().optional(),
        module_id: z.string().uuid().optional(),
        payload: z.unknown().optional(),
        modality: z.string().optional(),
        duration_secs: z.number().optional(),
      }),
    )
    .min(1),
})

const nextActionRequest = z.object({
  user_id: z.string().uuid().optional(),
})

const embedTokenRequest = z.object({
  user_id: z.string().uuid(),
  course_id: z.string().uuid().optional(),
  module_id: z.string().uuid().optional(),
})

const identityResolveRequest = z.object({
  provider: z.string().min(1).max(64).optional(),
  external_user_id: z.string().min(1).max(512),
})

const SAMPLE_USER = 'aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee'

describe('ALP golden payloads (contract)', () => {
  it('POST /api/alp/events body', () => {
    const golden = {
      user_id: SAMPLE_USER,
      events: [
        {
          event_type: 'module_complete',
          course_id: 'bbbbbbbb-bbbb-4ccc-8ddd-eeeeeeeeeeee',
          module_id: 'cccccccc-cccc-4ccc-8ddd-eeeeeeeeeeee',
          payload: { source: 'moodle_completion' },
          modality: 'text',
          duration_secs: 120,
        },
        {
          event_type: 'quiz_attempt',
          payload: { score: 8, max_score: 10, passed: true },
        },
      ],
    }
    expect(() => eventsRequest.parse(golden)).not.toThrow()
  })

  it('rejects non-uuid user_id for events', () => {
    expect(() =>
      eventsRequest.parse({
        user_id: '42',
        events: [{ event_type: 'module_complete' }],
      }),
    ).toThrow()
  })

  it('POST /api/alp/next-action body', () => {
    expect(() => nextActionRequest.parse({ user_id: SAMPLE_USER })).not.toThrow()
    expect(() => nextActionRequest.parse({})).not.toThrow()
  })

  it('POST /api/alp/embed-token body', () => {
    expect(() =>
      embedTokenRequest.parse({
        user_id: SAMPLE_USER,
        course_id: 'dddddddd-dddd-4ddd-8ddd-eeeeeeeeeeee',
      }),
    ).not.toThrow()
  })

  it('POST /api/alp/identity/resolve body', () => {
    expect(() =>
      identityResolveRequest.parse({
        provider: 'moodle',
        external_user_id: '12345',
      }),
    ).not.toThrow()
  })
})

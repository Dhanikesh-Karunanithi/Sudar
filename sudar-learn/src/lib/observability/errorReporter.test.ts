import { describe, expect, it } from 'vitest'

import { buildSentryEnvelope, parseSentryDsn } from '../../../../shared/observability/errorReporter'

describe('errorReporter', () => {
  it('parses a Sentry DSN into an envelope URL', () => {
    const parsed = parseSentryDsn('https://abc123@o42.ingest.sentry.io/98765')
    expect(parsed?.envelopeUrl).toBe('https://o42.ingest.sentry.io/api/98765/envelope/?sentry_key=abc123&sentry_version=7')
  })

  it('returns null for missing or malformed DSNs', () => {
    expect(parseSentryDsn(undefined)).toBeNull()
    expect(parseSentryDsn('')).toBeNull()
    expect(parseSentryDsn('not a url')).toBeNull()
    expect(parseSentryDsn('https://o42.ingest.sentry.io/98765')).toBeNull()
  })

  it('builds a three-line envelope without query strings', () => {
    const dsn = parseSentryDsn('https://abc123@o42.ingest.sentry.io/98765')!
    const envelope = buildSentryEnvelope(new Error('boom'), {
      app: 'learn',
      runtime: 'server',
      route: '/courses/[id]/learn?token=secret',
      digest: 'd1',
    }, dsn)
    const lines = envelope.split('\n')
    expect(lines).toHaveLength(3)
    const event = JSON.parse(lines[2]) as { tags: Record<string, string>; exception: { values: { value: string }[] } }
    expect(event.tags.route).toBe('/courses/[id]/learn')
    expect(event.exception.values[0].value).toBe('boom')
    expect(envelope).not.toContain('secret')
  })
})

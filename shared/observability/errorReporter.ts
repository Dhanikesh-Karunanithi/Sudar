/**
 * Dependency-free Sentry envelope reporter for Studio + Learn (browser and Workers).
 * The full @sentry/nextjs SDK is avoided because it hooks the build and is fragile on OpenNext;
 * this sends one event per error and is a no-op when no DSN is configured.
 * Privacy: only error name/message/stack, app, runtime, route pathname and Next digest are sent —
 * never request bodies, query strings, cookies or user ids.
 */

export type ReportingApp = 'learn' | 'studio'
export type ReportingRuntime = 'browser' | 'server'

export interface ErrorReportContext {
  app: ReportingApp
  runtime: ReportingRuntime
  route?: string
  digest?: string
  environment?: string
  release?: string
}

export interface ParsedSentryDsn {
  dsn: string
  envelopeUrl: string
}

const MAX_MESSAGE_CHARS = 2000
const MAX_STACK_CHARS = 8000

export function parseSentryDsn(raw: string | null | undefined): ParsedSentryDsn | null {
  const dsn = raw?.trim()
  if (!dsn) return null
  try {
    const url = new URL(dsn)
    const publicKey = url.username
    const segments = url.pathname.split('/').filter(Boolean)
    const projectId = segments.pop()
    if (!publicKey || !projectId) return null
    const prefix = segments.length ? `/${segments.join('/')}` : ''
    return {
      dsn,
      envelopeUrl: `${url.protocol}//${url.host}${prefix}/api/${projectId}/envelope/?sentry_key=${publicKey}&sentry_version=7`,
    }
  } catch {
    return null
  }
}

function stripQuery(route: string | undefined): string | undefined {
  if (!route) return undefined
  return route.split(/[?#]/)[0]
}

function toError(value: unknown): { name: string; message: string; stack?: string } {
  if (value instanceof Error) return { name: value.name || 'Error', message: value.message, stack: value.stack }
  if (typeof value === 'string') return { name: 'Error', message: value }
  try {
    return { name: 'NonError', message: JSON.stringify(value) }
  } catch {
    return { name: 'NonError', message: String(value) }
  }
}

function newEventId(): string {
  return crypto.randomUUID().replace(/-/g, '')
}

export function buildSentryEnvelope(error: unknown, ctx: ErrorReportContext, dsn: ParsedSentryDsn): string {
  const err = toError(error)
  const eventId = newEventId()
  const route = stripQuery(ctx.route)
  const event = {
    event_id: eventId,
    timestamp: Date.now() / 1000,
    platform: 'javascript',
    level: 'error',
    environment: ctx.environment ?? 'production',
    ...(ctx.release ? { release: ctx.release } : {}),
    tags: { app: ctx.app, runtime: ctx.runtime, ...(route ? { route } : {}) },
    ...(route ? { transaction: route } : {}),
    exception: { values: [{ type: err.name, value: err.message.slice(0, MAX_MESSAGE_CHARS) }] },
    extra: {
      ...(err.stack ? { stack: err.stack.slice(0, MAX_STACK_CHARS) } : {}),
      ...(ctx.digest ? { digest: ctx.digest } : {}),
    },
  }
  const header = { event_id: eventId, sent_at: new Date().toISOString(), dsn: dsn.dsn }
  return [JSON.stringify(header), JSON.stringify({ type: 'event' }), JSON.stringify(event)].join('\n')
}

/** Never throws; reporting must not break the request or page that failed. */
export async function reportError(
  rawDsn: string | null | undefined,
  error: unknown,
  ctx: ErrorReportContext
): Promise<void> {
  const dsn = parseSentryDsn(rawDsn)
  if (!dsn) return
  try {
    await fetch(dsn.envelopeUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=UTF-8' },
      body: buildSentryEnvelope(error, ctx, dsn),
      keepalive: true,
    })
  } catch {
    // Swallow: monitoring outages must not surface to users.
  }
}

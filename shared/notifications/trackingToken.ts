import { createHmac, timingSafeEqual } from 'crypto'

const DEFAULT_TTL_SECONDS = 60 * 60 * 24 * 30

type TrackingTokenPayload = {
  notificationId: string
  event: 'open' | 'click'
  exp: number
}

function secret(): string {
  const value = process.env.NOTIFICATION_LINK_SIGNING_SECRET?.trim()
  if (!value) throw new Error('NOTIFICATION_LINK_SIGNING_SECRET must be set')
  return value
}

function encode(input: string): string {
  return Buffer.from(input, 'utf8').toString('base64url')
}

function decode(input: string): string {
  return Buffer.from(input, 'base64url').toString('utf8')
}

function sign(payloadPart: string): string {
  return createHmac('sha256', secret()).update(payloadPart, 'utf8').digest('base64url')
}

export function createNotificationTrackingToken(
  notificationId: string,
  event: 'open' | 'click',
  ttlSeconds = DEFAULT_TTL_SECONDS,
): string {
  const payload: TrackingTokenPayload = {
    notificationId,
    event,
    exp: Math.floor(Date.now() / 1000) + ttlSeconds,
  }
  const payloadPart = encode(JSON.stringify(payload))
  return `${payloadPart}.${sign(payloadPart)}`
}

export function verifyNotificationTrackingToken(
  token: string,
): { valid: true; notificationId: string; event: 'open' | 'click' } | { valid: false; reason: string } {
  const [payloadPart, sigPart] = token.split('.')
  if (!payloadPart || !sigPart) return { valid: false, reason: 'malformed' }

  const expectedSig = sign(payloadPart)
  const provided = Buffer.from(sigPart, 'base64url')
  const expected = Buffer.from(expectedSig, 'base64url')
  if (provided.length !== expected.length || !timingSafeEqual(provided, expected)) {
    return { valid: false, reason: 'invalid_signature' }
  }

  try {
    const payload = JSON.parse(decode(payloadPart)) as TrackingTokenPayload
    if (!payload.notificationId || !['open', 'click'].includes(payload.event)) {
      return { valid: false, reason: 'invalid_payload' }
    }
    if (!payload.exp || payload.exp < Math.floor(Date.now() / 1000)) {
      return { valid: false, reason: 'expired' }
    }
    return { valid: true, notificationId: payload.notificationId, event: payload.event }
  } catch {
    return { valid: false, reason: 'invalid_payload' }
  }
}

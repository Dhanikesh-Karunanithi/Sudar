import { createHmac, timingSafeEqual } from 'crypto'

interface UnsubscribeTokenPayload {
  userId: string
  exp: number
}

const DEFAULT_TTL_SECONDS = 60 * 60 * 24 * 30

function base64UrlEncode(input: string): string {
  return Buffer.from(input, 'utf8').toString('base64url')
}

function base64UrlDecode(input: string): string {
  return Buffer.from(input, 'base64url').toString('utf8')
}

function tokenSecret(): string {
  const secret = process.env.NOTIFICATION_UNSUBSCRIBE_SECRET ?? process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!secret) throw new Error('NOTIFICATION_UNSUBSCRIBE_SECRET or SUPABASE_SERVICE_ROLE_KEY must be set')
  return secret
}

function sign(payloadPart: string): string {
  return createHmac('sha256', tokenSecret()).update(payloadPart).digest('base64url')
}

export function createUnsubscribeToken(userId: string, ttlSeconds = DEFAULT_TTL_SECONDS): string {
  const payload: UnsubscribeTokenPayload = {
    userId,
    exp: Math.floor(Date.now() / 1000) + ttlSeconds,
  }
  const payloadPart = base64UrlEncode(JSON.stringify(payload))
  const sig = sign(payloadPart)
  return `${payloadPart}.${sig}`
}

export function verifyUnsubscribeToken(token: string): { valid: true; userId: string } | { valid: false; reason: string } {
  const [payloadPart, sigPart] = token.split('.')
  if (!payloadPart || !sigPart) return { valid: false, reason: 'malformed' }

  const expectedSig = sign(payloadPart)
  const provided = Buffer.from(sigPart, 'base64url')
  const expected = Buffer.from(expectedSig, 'base64url')
  if (provided.length !== expected.length || !timingSafeEqual(provided, expected)) {
    return { valid: false, reason: 'invalid_signature' }
  }

  let payload: UnsubscribeTokenPayload
  try {
    payload = JSON.parse(base64UrlDecode(payloadPart)) as UnsubscribeTokenPayload
  } catch {
    return { valid: false, reason: 'invalid_payload' }
  }

  if (!payload.userId || typeof payload.userId !== 'string') return { valid: false, reason: 'invalid_user' }
  if (!payload.exp || payload.exp < Math.floor(Date.now() / 1000)) return { valid: false, reason: 'expired' }

  return { valid: true, userId: payload.userId }
}

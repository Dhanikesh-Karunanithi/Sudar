import { createHmac, timingSafeEqual } from 'crypto'

const COOKIE_NAME = 'sudar_vid_render'
const GRANT_TTL_SEC = 7200

function grantSecret(): string {
  const s =
    process.env.SUDARVID_RENDER_GRANT_SECRET?.trim()
    || process.env.SUPABASE_SERVICE_ROLE_KEY?.trim()
    || ''
  return s
}

function sign(bodyB64: string): string {
  const secret = grantSecret()
  if (!secret) return ''
  return createHmac('sha256', secret).update(bodyB64).digest('base64url')
}

export type SudarVidRenderGrantPayload = {
  u: string
  j: string
  e: number
}

/** Mint a signed grant the browser stores as HttpOnly cookie for iframe subresource loads. */
export function mintSudarVidRenderGrant(userId: string, jobId: string): string | null {
  const secret = grantSecret()
  if (!secret) return null
  const e = Math.floor(Date.now() / 1000) + GRANT_TTL_SEC
  const payload: SudarVidRenderGrantPayload = { u: userId, j: jobId, e }
  const body = Buffer.from(JSON.stringify(payload), 'utf8').toString('base64url')
  const sig = sign(body)
  return `${body}.${sig}`
}

export function verifySudarVidRenderGrant(
  raw: string | undefined,
  jobIdFromUrl: string,
): SudarVidRenderGrantPayload | null {
  if (!raw) return null
  const secret = grantSecret()
  if (!secret) return null
  const dot = raw.indexOf('.')
  if (dot <= 0) return null
  const body = raw.slice(0, dot)
  const sig = raw.slice(dot + 1)
  const expected = sign(body)
  if (expected.length !== sig.length || !timingSafeEqual(Buffer.from(expected), Buffer.from(sig))) {
    return null
  }
  let payload: SudarVidRenderGrantPayload
  try {
    payload = JSON.parse(Buffer.from(body, 'base64url').toString('utf8')) as SudarVidRenderGrantPayload
  } catch {
    return null
  }
  if (!payload.u || !payload.j || typeof payload.e !== 'number') return null
  if (payload.j !== jobIdFromUrl) return null
  if (payload.e * 1000 < Date.now()) return null
  return payload
}

export const SUDAR_VID_RENDER_COOKIE = {
  name: COOKIE_NAME,
  path: '/api/ai/generate-video/render',
  maxAge: GRANT_TTL_SEC,
} as const

import { signEmbedPayload } from '@/lib/alp-auth'

export const ALP_SIM_EMBED_EXPIRY_SEC = 3600

export type SimEmbedMode = 'author' | 'play'

export function createAlpSimEmbedToken(
  userId: string,
  orgId: string,
  mode: SimEmbedMode,
  scenarioId?: string | null,
): string {
  const exp = Math.floor(Date.now() / 1000) + ALP_SIM_EMBED_EXPIRY_SEC
  const payload = JSON.stringify({
    sub: userId,
    org_id: orgId,
    scope: 'sim',
    mode,
    scenario_id: scenarioId ?? null,
    exp,
    iat: Math.floor(Date.now() / 1000),
  })
  const b64 = Buffer.from(payload, 'utf8').toString('base64url')
  const sig = signEmbedPayload(b64)
  return `${b64}.${sig}`
}

export type SimEmbedPayload = {
  sub: string
  org_id: string
  scope: 'sim'
  mode: SimEmbedMode
  scenario_id: string | null
  exp: number
  iat: number
}

export function validateSimEmbedToken(token: string | null): SimEmbedPayload | null {
  if (!token || !token.includes('.')) return null
  const [b64, sig] = token.split('.')
  if (!b64 || !sig) return null
  const expected = signEmbedPayload(b64)
  if (expected !== sig) return null
  try {
    const payload = JSON.parse(Buffer.from(b64, 'base64url').toString('utf8')) as SimEmbedPayload
    if (payload.exp < Math.floor(Date.now() / 1000)) return null
    if (payload.scope !== 'sim' || !payload.org_id) return null
    return payload
  } catch {
    return null
  }
}

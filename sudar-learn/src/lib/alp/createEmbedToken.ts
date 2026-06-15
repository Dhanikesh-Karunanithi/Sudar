import { signEmbedPayload } from '@/lib/alp-auth'

export const ALP_CREATE_EMBED_EXPIRY_SEC = 3600

export function createAlpCreateEmbedToken(
  userId: string,
  orgId: string,
  tool?: string | null,
): string {
  const exp = Math.floor(Date.now() / 1000) + ALP_CREATE_EMBED_EXPIRY_SEC
  const payload = JSON.stringify({
    sub: userId,
    org_id: orgId,
    scope: 'create',
    tool: tool ?? null,
    exp,
    iat: Math.floor(Date.now() / 1000),
  })
  const b64 = Buffer.from(payload, 'utf8').toString('base64url')
  const sig = signEmbedPayload(b64)
  return `${b64}.${sig}`
}

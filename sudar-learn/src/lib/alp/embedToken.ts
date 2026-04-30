import { signEmbedPayload } from '@/lib/alp-auth'

export const ALP_EMBED_EXPIRY_SEC = 3600

export function createAlpEmbedToken(
  userId: string,
  courseId?: string | null,
  moduleId?: string | null,
): string {
  const exp = Math.floor(Date.now() / 1000) + ALP_EMBED_EXPIRY_SEC
  const payload = JSON.stringify({
    sub: userId,
    course_id: courseId ?? null,
    module_id: moduleId ?? null,
    exp,
    iat: Math.floor(Date.now() / 1000),
  })
  const b64 = Buffer.from(payload, 'utf8').toString('base64url')
  const sig = signEmbedPayload(b64)
  return `${b64}.${sig}`
}

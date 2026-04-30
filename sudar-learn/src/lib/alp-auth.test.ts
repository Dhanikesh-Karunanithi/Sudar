import { describe, expect, it, beforeEach, afterEach } from 'vitest'

import type { AlpKeyResult } from '@/lib/alp-auth'
import {
  getEmbedSigningSecretConfigured,
  rejectAlpUserOutsideOrg,
  signEmbedPayload,
  validateEmbedToken,
} from '@/lib/alp-auth'

describe('ALP embed token signing', () => {
  const prev = { ...process.env }

  beforeEach(() => {
    process.env.ALP_EMBED_SIGNING_SECRET = 'test-embed-secret-for-vitest-only'
    delete process.env.ALP_EMBED_SECRET
  })

  afterEach(() => {
    process.env = { ...prev }
  })

  it('reports signing configured when secret is set', () => {
    expect(getEmbedSigningSecretConfigured()).toBe(true)
  })

  it('round-trips a valid token', () => {
    const payload = JSON.stringify({
      sub: 'user-uuid',
      course_id: 'course-1',
      module_id: null,
      exp: Math.floor(Date.now() / 1000) + 3600,
      iat: Math.floor(Date.now() / 1000),
    })
    const b64 = Buffer.from(payload, 'utf8').toString('base64url')
    const token = `${b64}.${signEmbedPayload(b64)}`
    const parsed = validateEmbedToken(token)
    expect(parsed?.sub).toBe('user-uuid')
    expect(parsed?.course_id).toBe('course-1')
  })

  it('rejects tampered signature', () => {
    const payload = JSON.stringify({
      sub: 'user-uuid',
      exp: Math.floor(Date.now() / 1000) + 3600,
      iat: Math.floor(Date.now() / 1000),
    })
    const b64 = Buffer.from(payload, 'utf8').toString('base64url')
    const token = `${b64}.not-a-real-sig`
    expect(validateEmbedToken(token)).toBeNull()
  })

  it('rejects expired token', () => {
    const payload = JSON.stringify({
      sub: 'user-uuid',
      exp: Math.floor(Date.now() / 1000) - 10,
      iat: Math.floor(Date.now() / 1000) - 3600,
    })
    const b64 = Buffer.from(payload, 'utf8').toString('base64url')
    const token = `${b64}.${signEmbedPayload(b64)}`
    expect(validateEmbedToken(token)).toBeNull()
  })
})

describe('rejectAlpUserOutsideOrg', () => {
  it('returns 403 when org-scoped key and user is not in org', async () => {
    const admin = {
      from: () => ({
        select: () => ({
          eq: () => ({
            eq: () => ({
              maybeSingle: async () => ({ data: null }),
            }),
          }),
        }),
      }),
    }
    const auth: AlpKeyResult = { valid: true, orgId: 'org-1', keyId: 'k1' }
    const res = await rejectAlpUserOutsideOrg(admin, auth, 'user-not-in-org')
    expect(res).not.toBeNull()
    expect(res?.status).toBe(403)
  })

  it('returns null when key is not org-scoped', async () => {
    const admin = { from: () => ({}) }
    const auth: AlpKeyResult = { valid: true }
    const res = await rejectAlpUserOutsideOrg(admin, auth, 'any-user')
    expect(res).toBeNull()
  })
})

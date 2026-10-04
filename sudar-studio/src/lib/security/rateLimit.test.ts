import { describe, expect, it } from 'vitest'

import {
  INVITE_CODE_RATE_LIMIT,
  checkRateLimit,
  clientIpFromHeaders,
  rateLimitBucketKey,
} from '@shared-access/rateLimit'
import type { RateLimitClient } from '@shared-access/rateLimit'

function fakeAdmin(result: { data: unknown; error: unknown }): RateLimitClient {
  return { rpc: async () => result }
}

describe('rateLimit', () => {
  it('prefers cf-connecting-ip, then x-forwarded-for', () => {
    expect(clientIpFromHeaders(new Headers({ 'cf-connecting-ip': '1.1.1.1', 'x-forwarded-for': '2.2.2.2' }))).toBe(
      '1.1.1.1'
    )
    expect(clientIpFromHeaders(new Headers({ 'x-forwarded-for': '2.2.2.2, 3.3.3.3' }))).toBe('2.2.2.2')
    expect(clientIpFromHeaders(new Headers())).toBe('unknown')
  })

  it('hashes identities so raw IPs are never stored', async () => {
    const key = await rateLimitBucketKey(INVITE_CODE_RATE_LIMIT, '1.1.1.1')
    expect(key.startsWith('invite:')).toBe(true)
    expect(key).not.toContain('1.1.1.1')
  })

  it('blocks when the RPC reports over limit and fails open on errors', async () => {
    expect(await checkRateLimit(fakeAdmin({ data: false, error: null }), INVITE_CODE_RATE_LIMIT, 'x')).toBe(false)
    expect(await checkRateLimit(fakeAdmin({ data: true, error: null }), INVITE_CODE_RATE_LIMIT, 'x')).toBe(true)
    expect(await checkRateLimit(fakeAdmin({ data: null, error: { message: 'boom' } }), INVITE_CODE_RATE_LIMIT, 'x')).toBe(
      true
    )
  })
})

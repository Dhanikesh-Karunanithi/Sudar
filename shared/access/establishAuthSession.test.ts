import { describe, expect, it, vi } from 'vitest'

import {
  establishSessionFromAuthCallback,
  parseAuthCallbackSearchParams,
} from './establishAuthSession'

describe('parseAuthCallbackSearchParams', () => {
  it('reads code and invite token_hash params', () => {
    const params = parseAuthCallbackSearchParams(
      new URLSearchParams('code=abc&token_hash=xyz&type=invite&error=oauth')
    )
    expect(params).toEqual({
      code: 'abc',
      tokenHash: 'xyz',
      otpType: 'invite',
      oauthError: 'oauth',
    })
  })
})

describe('establishSessionFromAuthCallback', () => {
  it('verifies invite token_hash before code exchange', async () => {
    const verifyOtp = vi.fn().mockResolvedValue({ error: null })
    const exchangeCodeForSession = vi.fn()
    const supabase = {
      auth: { verifyOtp, exchangeCodeForSession },
    }

    const result = await establishSessionFromAuthCallback(supabase as never, {
      code: 'unused',
      tokenHash: 'hash',
      otpType: 'invite',
      oauthError: null,
    })

    expect(result).toEqual({ ok: true })
    expect(verifyOtp).toHaveBeenCalledWith({ token_hash: 'hash', type: 'invite' })
    expect(exchangeCodeForSession).not.toHaveBeenCalled()
  })

  it('exchanges PKCE code when no token_hash is present', async () => {
    const verifyOtp = vi.fn()
    const exchangeCodeForSession = vi.fn().mockResolvedValue({ error: null })
    const supabase = {
      auth: { verifyOtp, exchangeCodeForSession },
    }

    const result = await establishSessionFromAuthCallback(supabase as never, {
      code: 'pkce-code',
      tokenHash: null,
      otpType: null,
      oauthError: null,
    })

    expect(result).toEqual({ ok: true })
    expect(exchangeCodeForSession).toHaveBeenCalledWith('pkce-code')
    expect(verifyOtp).not.toHaveBeenCalled()
  })
})

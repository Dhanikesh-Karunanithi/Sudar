import { describe, expect, it, vi } from 'vitest'

import { applyInviteToProfile } from './applyInviteToProfile'
import { redeemInviteCode } from './inviteCodes'

describe('redeemInviteCode', () => {
  it('requires the invite code on the profile before redeeming', async () => {
    const rpc = vi.fn()
    const supabase = {
      from: vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            eq: vi.fn(() => ({
              maybeSingle: vi.fn().mockResolvedValue({
                data: { code: 'EARLY', is_active: true, uses_count: 0, max_uses: 1 },
              }),
            })),
            maybeSingle: vi.fn().mockResolvedValue({
              data: { signup_code_used: null },
            }),
          })),
        })),
      })),
      rpc,
    }

    const result = await redeemInviteCode(supabase as never, 'user-1', 'EARLY')

    expect(result).toEqual({ ok: false, error: 'Invite code is not active on this account.' })
    expect(rpc).not.toHaveBeenCalled()
  })

  it('uses atomic RPC when the profile already carries the code', async () => {
    const rpc = vi.fn().mockResolvedValue({ data: { ok: true, code: 'EARLY' } })
    const supabase = {
      from: vi.fn((table: string) => {
        if (table === 'invite_codes') {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                eq: vi.fn(() => ({
                  maybeSingle: vi.fn().mockResolvedValue({
                    data: { code: 'EARLY', is_active: true, uses_count: 0, max_uses: 1, type: 'early_access', grants_tier: 'early_access', bonus_credits: 0 },
                  }),
                })),
              })),
            })),
          }
        }
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              maybeSingle: vi.fn().mockResolvedValue({
                data: { signup_code_used: 'EARLY' },
              }),
            })),
          })),
        }
      }),
      rpc,
    }

    const result = await redeemInviteCode(supabase as never, 'user-1', 'early')

    expect(result).toEqual({ ok: true })
    expect(rpc).toHaveBeenCalledWith('redeem_invite_code_internal', { raw_code: 'EARLY' })
  })
})

describe('applyInviteToProfile', () => {
  it('redeems before writing access to the profile', async () => {
    const calls: string[] = []
    const rpc = vi.fn().mockImplementation(async () => {
      calls.push('redeem')
      return { data: { ok: true, code: 'EARLY' } }
    })

    const supabase = {
      from: vi.fn((table: string) => {
        if (table === 'profiles') {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                maybeSingle: vi.fn().mockResolvedValue({ data: { signup_code_used: null, access_tier: 'default' } }),
              })),
            })),
            update: vi.fn(() => {
              calls.push('update')
              return { eq: vi.fn().mockResolvedValue({ error: null }) }
            }),
          }
        }
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              eq: vi.fn(() => ({
                maybeSingle: vi.fn().mockResolvedValue({
                  data: {
                    code: 'EARLY',
                    is_active: true,
                    uses_count: 0,
                    max_uses: 1,
                    type: 'early_access',
                    grants_tier: 'early_access',
                    bonus_credits: 0,
                  },
                }),
              })),
            })),
          })),
        }
      }),
      rpc,
    }

    const result = await applyInviteToProfile(supabase as never, 'user-1', 'EARLY')

    expect(result).toEqual({ ok: true })
    expect(calls).toEqual(['redeem', 'update'])
  })

  it('does not re-redeem when profile already has a signup code', async () => {
    const rpc = vi.fn()
    const supabase = {
      from: vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            maybeSingle: vi.fn().mockResolvedValue({
              data: { signup_code_used: 'EARLY', access_tier: 'early_access' },
            }),
          })),
        })),
      })),
      rpc,
    }

    const result = await applyInviteToProfile(supabase as never, 'user-1', 'EARLY')

    expect(result).toEqual({ ok: true, alreadyApplied: true })
    expect(rpc).not.toHaveBeenCalled()
  })

  it('does not grant access when atomic redeem fails', async () => {
    const update = vi.fn()
    const supabase = {
      from: vi.fn((table: string) => {
        if (table === 'profiles') {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                maybeSingle: vi.fn().mockResolvedValue({ data: { signup_code_used: null, access_tier: 'default' } }),
              })),
            })),
            update,
          }
        }
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              eq: vi.fn(() => ({
                maybeSingle: vi.fn().mockResolvedValue({
                  data: {
                    code: 'EARLY',
                    is_active: true,
                    uses_count: 1,
                    max_uses: 1,
                    type: 'early_access',
                    grants_tier: 'early_access',
                    bonus_credits: 0,
                  },
                }),
              })),
            })),
          })),
        }
      }),
      rpc: vi.fn().mockResolvedValue({ data: { ok: false, error: 'Invalid or expired invite code.' } }),
    }

    const result = await applyInviteToProfile(supabase as never, 'user-1', 'EARLY')

    expect(result.ok).toBe(false)
    expect(update).not.toHaveBeenCalled()
  })
})

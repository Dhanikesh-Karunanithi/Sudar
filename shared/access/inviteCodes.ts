import type { SupabaseClient } from '@supabase/supabase-js'

type AccessSupabase = SupabaseClient<Record<string, unknown>>

import type { InviteCodeType, InviteValidation } from './types'
import { ORG_INVITE_CODE, ORG_PROVISIONED_CODE, GRANDFATHERED_CODE } from './constants'

const PROFILE_INVITE_MARKERS = new Set([ORG_INVITE_CODE, ORG_PROVISIONED_CODE, GRANDFATHERED_CODE])

function normalizeCode(code: string): string {
  return code.trim().toUpperCase()
}

type RedeemRpcResult = {
  ok: boolean
  error?: string
  code?: string
}

async function atomicRedeemInviteCode(
  supabase: AccessSupabase,
  code: string
): Promise<{ ok: true; code: string } | { ok: false; error: string }> {
  const { data, error } = await supabase.rpc('redeem_invite_code_internal', {
    raw_code: code,
  })

  if (error) {
    return { ok: false, error: 'Could not redeem invite code.' }
  }

  const result = data as RedeemRpcResult | null
  if (!result?.ok) {
    return { ok: false, error: result?.error ?? 'Invalid or expired invite code.' }
  }

  return { ok: true, code: result.code ?? code }
}

export async function validateInviteCode(
  supabase: AccessSupabase,
  rawCode: string
): Promise<InviteValidation> {
  const code = normalizeCode(rawCode)
  if (!code || code.length < 4) {
    return { valid: false, error: 'Invite code is required.' }
  }

  const { data: invite } = await supabase
    .from('invite_codes')
    .select('*')
    .eq('code', code)
    .eq('is_active', true)
    .maybeSingle()

  if (!invite) {
    return { valid: false, error: 'Invalid or expired invite code.' }
  }

  if (invite.expires_at && new Date(invite.expires_at) < new Date()) {
    return { valid: false, error: 'This invite code has expired.' }
  }

  if (invite.max_uses != null && invite.uses_count >= invite.max_uses) {
    return { valid: false, error: 'This invite code has reached its usage limit.' }
  }

  return {
    valid: true,
    code: invite.code,
    type: invite.type as InviteCodeType,
    grantsTier: invite.grants_tier,
    bonusCredits: invite.bonus_credits ?? 0,
    referrerId: invite.owner_user_id ?? undefined,
  }
}

export type RedeemInviteOptions = {
  /** When true, skip the profile ownership check (apply-profile flow redeems before writing). */
  skipProfileCheck?: boolean
}

export async function redeemInviteCode(
  supabase: AccessSupabase,
  userId: string,
  rawCode: string,
  options: RedeemInviteOptions = {}
): Promise<{ ok: boolean; error?: string }> {
  const validation = await validateInviteCode(supabase, rawCode)
  if (!validation.valid) {
    return { ok: false, error: validation.error }
  }

  const code = normalizeCode(rawCode)

  if (!options.skipProfileCheck) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('signup_code_used')
      .eq('id', userId)
      .maybeSingle()

    const profileCode = profile?.signup_code_used
    if (!profileCode || PROFILE_INVITE_MARKERS.has(profileCode)) {
      return { ok: false, error: 'Invite code is not active on this account.' }
    }
    if (normalizeCode(profileCode) !== code) {
      return { ok: false, error: 'Invite code is not active on this account.' }
    }
  }

  const redeemed = await atomicRedeemInviteCode(supabase, code)
  return redeemed.ok ? { ok: true } : { ok: false, error: redeemed.error }
}

import type { SupabaseClient } from '@supabase/supabase-js'

import { redeemInviteCode, validateInviteCode } from './inviteCodes'

type AccessSupabase = SupabaseClient<Record<string, unknown>>

export async function ensureInviteRedeemed(
  supabase: AccessSupabase,
  userId: string,
  rawCode: string
): Promise<void> {
  const validation = await validateInviteCode(supabase, rawCode)
  if (!validation.valid) return
  await redeemInviteCode(supabase, userId, rawCode)
}

export async function applyInviteToProfile(
  supabase: AccessSupabase,
  userId: string,
  rawCode: string
): Promise<{ ok: boolean; error?: string; alreadyApplied?: boolean }> {
  const { data: profile } = await supabase
    .from('profiles')
    .select('signup_code_used, access_tier')
    .eq('id', userId)
    .single()

  if (profile?.signup_code_used) {
    return { ok: true, alreadyApplied: true }
  }

  const validation = await validateInviteCode(supabase, rawCode)
  if (!validation.valid) {
    return { ok: false, error: validation.error }
  }

  const redeemResult = await redeemInviteCode(supabase, userId, rawCode)
  if (!redeemResult.ok) {
    return { ok: false, error: redeemResult.error }
  }

  await supabase
    .from('profiles')
    .update({
      access_tier: validation.grantsTier ?? 'early_access',
      signup_code_used: validation.code ?? rawCode.trim().toUpperCase(),
    })
    .eq('id', userId)

  return { ok: true }
}

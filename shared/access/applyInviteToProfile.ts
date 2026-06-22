import type { SupabaseClient } from '@supabase/supabase-js'

import { redeemInviteCode, validateInviteCode } from './inviteCodes'

type AccessSupabase = SupabaseClient<Record<string, unknown>>

export async function applyInviteToProfile(
  supabase: AccessSupabase,
  userId: string,
  rawCode: string
): Promise<{ ok: boolean; error?: string; alreadyApplied?: boolean }> {
  const { data: profile } = await supabase
    .from('profiles')
    .select('signup_code_used, access_tier')
    .eq('id', userId)
    .maybeSingle()

  if (profile?.signup_code_used) {
    return { ok: true, alreadyApplied: true }
  }

  const validation = await validateInviteCode(supabase, rawCode)
  if (!validation.valid) {
    return { ok: false, error: validation.error }
  }

  const redeemed = await redeemInviteCode(supabase, userId, rawCode, { skipProfileCheck: true })
  if (!redeemed.ok) {
    return { ok: false, error: redeemed.error }
  }

  const { error: updateError } = await supabase
    .from('profiles')
    .update({
      access_tier: validation.grantsTier ?? 'early_access',
      signup_code_used: validation.code ?? rawCode.trim().toUpperCase(),
    })
    .eq('id', userId)

  if (updateError) {
    return { ok: false, error: 'Could not apply invite code to profile.' }
  }

  return { ok: true }
}

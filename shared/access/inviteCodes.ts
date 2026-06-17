import type { SupabaseClient } from '@supabase/supabase-js'

type AccessSupabase = SupabaseClient<Record<string, unknown>>

import type { InviteCodeType, InviteValidation } from './types'

function normalizeCode(code: string): string {
  return code.trim().toUpperCase()
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

export async function redeemInviteCode(
  supabase: AccessSupabase,
  _userId: string,
  rawCode: string
): Promise<{ ok: boolean; error?: string }> {
  const validation = await validateInviteCode(supabase, rawCode)
  if (!validation.valid) {
    return { ok: false, error: validation.error }
  }

  const code = normalizeCode(rawCode)

  const { data: invite } = await supabase
    .from('invite_codes')
    .select('id, uses_count, max_uses')
    .eq('code', code)
    .single()

  if (invite) {
    if (invite.max_uses != null && invite.uses_count >= invite.max_uses) {
      return { ok: false, error: 'Invite code already fully redeemed.' }
    }
    await supabase
      .from('invite_codes')
      .update({ uses_count: invite.uses_count + 1 })
      .eq('id', invite.id)
  }

  return { ok: true }
}

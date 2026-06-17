import type { SupabaseClient } from '@supabase/supabase-js'

import { applyInviteToProfile, ensureInviteRedeemed } from './applyInviteToProfile'
import { checkUserInviteAccess, grantOrgPlatformAccess } from './requireInvite'
import { ORG_INVITE_CODE } from './constants'

type AccessSupabase = SupabaseClient<Record<string, unknown>>

export async function processOrgInvites(
  admin: AccessSupabase,
  userId: string,
  email: string
): Promise<boolean> {
  const { data: invites } = await admin
    .from('org_invites')
    .select('org_id, role')
    .eq('email', email.toLowerCase())

  if (!invites?.length) return false

  for (const inv of invites) {
    await admin.from('profiles').update({ org_id: inv.org_id }).eq('id', userId)
    const { data: existing } = await admin
      .from('org_members')
      .select('id')
      .eq('org_id', inv.org_id)
      .eq('user_id', userId)
      .maybeSingle()
    if (!existing) {
      const orgRole = ['ADMIN', 'MANAGER', 'CREATOR', 'LEARNER'].includes(inv.role)
        ? inv.role
        : 'LEARNER'
      await admin.from('org_members').insert({
        org_id: inv.org_id,
        user_id: userId,
        role: orgRole,
      })
    }
    const { data: lp } = await admin
      .from('learner_profiles')
      .select('id')
      .eq('user_id', userId)
      .maybeSingle()
    if (!lp) await admin.from('learner_profiles').insert({ user_id: userId })
  }

  await admin.from('org_invites').delete().eq('email', email.toLowerCase())
  await grantOrgPlatformAccess(admin, userId, ORG_INVITE_CODE)
  return true
}

export async function finalizePostAuthInvite(
  admin: AccessSupabase,
  userId: string
): Promise<void> {
  const { data: profile } = await admin
    .from('profiles')
    .select('signup_code_used')
    .eq('id', userId)
    .maybeSingle()

  if (profile?.signup_code_used) {
    await ensureInviteRedeemed(admin, userId, profile.signup_code_used)
  }
}

export { applyInviteToProfile, checkUserInviteAccess }

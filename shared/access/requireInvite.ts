import type { SupabaseClient } from '@supabase/supabase-js'

import type { AccessTier } from './types'

type AccessSupabase = SupabaseClient<Record<string, unknown>>

const INVITE_EXEMPT_TIERS: AccessTier[] = ['tester', 'unlimited']

export type InviteAccessResult =
  | { hasAccess: true }
  | { hasAccess: false; reason: 'no_invite' | 'tier_requires_invite' }

export async function checkUserInviteAccess(
  userId: string,
  supabase: AccessSupabase
): Promise<InviteAccessResult> {
  const { data: profile } = await supabase
    .from('profiles')
    .select('signup_code_used, access_tier, role')
    .eq('id', userId)
    .maybeSingle()

  if (!profile) {
    return { hasAccess: false, reason: 'no_invite' }
  }

  const role = (profile.role as string | undefined)?.toLowerCase()
  if (role === 'super_admin') {
    return { hasAccess: true }
  }

  const tier = (profile.access_tier ?? 'default') as AccessTier

  if (INVITE_EXEMPT_TIERS.includes(tier)) {
    return { hasAccess: true }
  }

  const { data: tierConfig } = await supabase
    .from('access_tier_config')
    .select('requires_invite')
    .eq('tier', tier)
    .maybeSingle()

  if (tierConfig?.requires_invite === false) {
    return { hasAccess: true }
  }

  if (profile.signup_code_used) {
    return { hasAccess: true }
  }

  return { hasAccess: false, reason: 'tier_requires_invite' }
}

export async function grantOrgPlatformAccess(
  supabase: AccessSupabase,
  userId: string,
  marker: 'ORG_PROVISIONED' | 'ORG_INVITE'
): Promise<void> {
  await supabase
    .from('profiles')
    .update({
      access_tier: 'early_access',
      signup_code_used: marker,
    })
    .eq('id', userId)
    .is('signup_code_used', null)
}

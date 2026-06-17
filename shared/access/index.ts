export * from './types'
export * from './constants'
export * from './inviteCodes'
export * from './requireInvite'
export * from './applyInviteToProfile'
export * from './authIntent'
export * from './authCallback'

import type { SupabaseClient } from '@supabase/supabase-js'

type AccessSupabase = SupabaseClient<Record<string, unknown>>

export async function isEarlyAccessAdmin(
  supabase: AccessSupabase,
  userId: string,
  email: string | undefined
): Promise<boolean> {
  const { data: profile } = await supabase
    .from('profiles')
    .select('role, access_tier')
    .eq('id', userId)
    .maybeSingle()

  if ((profile?.role as string | undefined)?.toLowerCase() === 'super_admin') {
    return true
  }

  const tier = profile?.access_tier as string | undefined
  if (tier === 'tester' || tier === 'unlimited') {
    return true
  }

  const adminEmails = (process.env.ADMIN_EMAILS ?? '')
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean)

  return !!email && adminEmails.includes(email.toLowerCase())
}

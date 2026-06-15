import type { createServiceRoleSupabaseClient } from '@/lib/supabase/server'

type AdminClient = ReturnType<typeof createServiceRoleSupabaseClient>

/** True when the learner belongs to the resource org (profile or org_members). */
export async function learnerBelongsToOrg(
  admin: AdminClient,
  userId: string,
  orgId: string,
): Promise<boolean> {
  const { data: profile } = await admin
    .from('profiles')
    .select('org_id')
    .eq('id', userId)
    .maybeSingle()

  if (profile?.org_id === orgId) return true

  const { data: member } = await admin
    .from('org_members')
    .select('id')
    .eq('org_id', orgId)
    .eq('user_id', userId)
    .maybeSingle()

  return Boolean(member)
}

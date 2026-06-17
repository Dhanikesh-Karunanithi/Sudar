import type { createServiceRoleSupabaseClient } from '@/lib/supabase/server'

type AdminClient = ReturnType<typeof createServiceRoleSupabaseClient>

export async function getPathForOrg<T extends string = '*'>(
  admin: AdminClient,
  pathId: string,
  orgId: string,
  select: T = '*' as T,
) {
  const { data, error } = await admin
    .from('learning_paths')
    .select(select)
    .eq('id', pathId)
    .eq('org_id', orgId)
    .maybeSingle()

  if (error || !data) return null
  return data
}

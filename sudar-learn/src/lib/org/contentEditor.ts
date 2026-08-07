import type { SupabaseClient } from '@supabase/supabase-js'

const CONTENT_EDITOR_ROLES = ['ADMIN', 'MANAGER', 'CREATOR'] as const

/** True when the user may manage org content (courses, RAG ingest, knowledge bases). */
export async function userCanEditOrgContent(
  supabase: SupabaseClient,
  userId: string,
  orgId: string,
): Promise<boolean> {
  const { data } = await supabase
    .from('org_members')
    .select('role')
    .eq('org_id', orgId)
    .eq('user_id', userId)
    .maybeSingle()

  const role = data?.role as string | undefined
  return Boolean(role && (CONTENT_EDITOR_ROLES as readonly string[]).includes(role))
}

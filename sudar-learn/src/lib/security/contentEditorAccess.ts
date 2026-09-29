import type { SupabaseClient } from '@supabase/supabase-js'

const CONTENT_EDITOR_ROLES = new Set(['ADMIN', 'MANAGER', 'CREATOR'])

export interface ContentEditorScope {
  orgId: string
  isSuperAdmin: boolean
}

/**
 * Resolves the org a user may manage content for. Learners get null so service-role
 * content jobs (RAG ingest, re-embedding) cannot be triggered from a learner session.
 */
export async function resolveContentEditorScope(
  admin: SupabaseClient,
  userId: string
): Promise<ContentEditorScope | null> {
  const { data: profile } = await admin
    .from('profiles')
    .select('role, active_org_id, org_id')
    .eq('id', userId)
    .maybeSingle()
  const row = profile as { role: string | null; active_org_id: string | null; org_id: string | null } | null
  const orgId = row?.active_org_id ?? row?.org_id ?? null
  if (!orgId) return null

  const isSuperAdmin = row?.role?.toLowerCase() === 'super_admin'
  if (isSuperAdmin) return { orgId, isSuperAdmin }

  const { data: membership } = await admin
    .from('org_members')
    .select('role')
    .eq('org_id', orgId)
    .eq('user_id', userId)
    .maybeSingle()
  const role = (membership as { role: string | null } | null)?.role?.toUpperCase() ?? ''
  return CONTENT_EDITOR_ROLES.has(role) ? { orgId, isSuperAdmin: false } : null
}

/** True when the user belongs to the org via profile (home/active org) or an org_members row. */
export async function userInOrg(admin: SupabaseClient, userId: string, orgId: string | null): Promise<boolean> {
  if (!orgId) return false
  const { data: profile } = await admin
    .from('profiles')
    .select('active_org_id, org_id')
    .eq('id', userId)
    .maybeSingle()
  const row = profile as { active_org_id: string | null; org_id: string | null } | null
  if (row?.active_org_id === orgId || row?.org_id === orgId) return true
  const { data: membership } = await admin
    .from('org_members')
    .select('org_id')
    .eq('org_id', orgId)
    .eq('user_id', userId)
    .maybeSingle()
  return Boolean(membership)
}

export async function courseBelongsToOrg(admin: SupabaseClient, courseId: string, orgId: string): Promise<boolean> {
  const { data } = await admin.from('courses').select('org_id').eq('id', courseId).maybeSingle()
  return (data as { org_id: string | null } | null)?.org_id === orgId
}

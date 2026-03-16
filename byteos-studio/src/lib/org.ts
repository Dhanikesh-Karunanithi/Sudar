import { createClient, createAdminClient } from '@/lib/supabase/server'

/**
 * Returns the user's first org, or auto-creates a "Personal Workspace"
 * on their first Studio visit. Every course requires an org_id.
 * Uses the admin client (service role) for org/member provisioning to
 * bypass RLS policies that would otherwise block the initial insert.
 */
export async function getOrCreateOrg(userId: string): Promise<string> {
  const supabase = await createClient()
  const admin = createAdminClient()

  // Check for existing membership (anon client — reads user's own memberships)
  const { data: membership } = await supabase
    .from('org_members')
    .select('org_id')
    .eq('user_id', userId)
    .limit(1)
    .single()

  if (membership?.org_id) return membership.org_id

  // Create a personal workspace org — use admin client to bypass RLS
  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name')
    .eq('id', userId)
    .single()

  const orgName = profile?.full_name
    ? `${profile.full_name}'s Workspace`
    : 'My Workspace'

  const slug = `workspace-${userId.slice(0, 8)}`

  const { data: org, error } = await admin
    .from('organisations')
    .insert({ name: orgName, slug, plan: 'free' })
    .select('id')
    .single()

  if (error || !org) throw new Error(`Failed to create org: ${error?.message}`)

  await admin.from('org_members').insert({
    org_id: org.id,
    user_id: userId,
    role: 'ADMIN',
  })

  await admin
    .from('profiles')
    .update({ org_id: org.id })
    .eq('id', userId)

  return org.id
}

export type OrgRole = 'ADMIN' | 'MANAGER' | 'CREATOR' | 'LEARNER'

export async function isSuperAdmin(userId: string): Promise<boolean> {
  const supabase = await createClient()
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', userId)
    .single()

  return (profile as { role?: string } | null)?.role === 'super_admin'
}

/**
 * Returns org_id and the current user's role in that org.
 * Use after getOrCreateOrg so membership exists.
 */
export async function getOrgIdAndRole(userId: string): Promise<{ orgId: string; role: OrgRole }> {
  const supabase = await createClient()
  const orgId = await getOrCreateOrg(userId)
  const { data: membership } = await supabase
    .from('org_members')
    .select('role')
    .eq('org_id', orgId)
    .eq('user_id', userId)
    .single()
  const role = (membership?.role ?? 'LEARNER') as OrgRole
  return { orgId, role }
}

/**
 * Ensures the current user is an org Admin or Manager. Returns orgId.
 * Use in API routes that manage users or org settings.
 */
export async function requireOrgAdmin(userId: string): Promise<string> {
  if (await isSuperAdmin(userId)) {
    // Super admins are allowed to act as org admins; ensure they have an org for features that require one.
    return getOrCreateOrg(userId)
  }

  const { orgId, role } = await getOrgIdAndRole(userId)
  if (role !== 'ADMIN' && role !== 'MANAGER') {
    throw new Error('Forbidden: requires Admin or Manager role')
  }
  return orgId
}

export async function requireSuperAdmin(userId: string): Promise<void> {
  if (!(await isSuperAdmin(userId))) {
    throw new Error('Forbidden: requires Super Admin')
  }
}

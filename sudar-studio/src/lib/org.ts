import { createClient, createServiceRoleSupabaseClient } from '@/lib/supabase/server'

export type OrgRole = 'ADMIN' | 'MANAGER' | 'CREATOR' | 'LEARNER'

export type OrgMembership = {
  org_id: string
  org_name: string
  org_slug: string
  role: OrgRole
}

/**
 * Returns the user's first org, or auto-creates a "Personal Workspace"
 * on their first Studio visit. Every course requires an org_id.
 * Uses the admin client (service role) for org/member provisioning to
 * bypass RLS policies that would otherwise block the initial insert.
 */
export async function getOrCreateOrg(userId: string): Promise<string> {
  const supabase = await createClient()
  const admin = createServiceRoleSupabaseClient()

  const active = await getActiveOrgId(userId)
  if (active) return active

  const { data: membership } = await supabase
    .from('org_members')
    .select('org_id')
    .eq('user_id', userId)
    .order('joined_at', { ascending: true })
    .limit(1)
    .maybeSingle()

  if (membership?.org_id) {
    await syncActiveOrg(userId, membership.org_id)
    return membership.org_id
  }

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

  await syncActiveOrg(userId, org.id)

  return org.id
}

async function syncActiveOrg(userId: string, orgId: string): Promise<void> {
  const admin = createServiceRoleSupabaseClient()
  await admin
    .from('profiles')
    .update({ org_id: orgId, active_org_id: orgId })
    .eq('id', userId)
}

/**
 * Resolve the user's active organisation:
 * 1. profiles.active_org_id when membership exists
 * 2. profiles.org_id when membership exists
 * 3. earliest org_members row
 */
export async function getActiveOrgId(userId: string): Promise<string | null> {
  const admin = createServiceRoleSupabaseClient()
  const { data: profile } = await admin
    .from('profiles')
    .select('org_id, active_org_id')
    .eq('id', userId)
    .maybeSingle()

  const { data: memberships } = await admin
    .from('org_members')
    .select('org_id, role, created_at, organisations(name, slug)')
    .eq('user_id', userId)
    .order('joined_at', { ascending: true })

  const memberOrgIds = new Set((memberships ?? []).map((m) => m.org_id))

  const candidates = [profile?.active_org_id, profile?.org_id].filter(
    (id): id is string => typeof id === 'string' && memberOrgIds.has(id)
  )

  if (candidates.length > 0) return candidates[0]

  const first = memberships?.[0]?.org_id
  return first ?? null
}

export async function listOrgMemberships(userId: string): Promise<OrgMembership[]> {
  const admin = createServiceRoleSupabaseClient()
  const { data } = await admin
    .from('org_members')
    .select('org_id, role, organisations(name, slug)')
    .eq('user_id', userId)
    .order('joined_at', { ascending: true })

  return (data ?? []).map((row) => {
    const org = row.organisations as { name?: string; slug?: string } | null
    return {
      org_id: row.org_id,
      org_name: org?.name ?? 'Organisation',
      org_slug: org?.slug ?? '',
      role: (row.role ?? 'LEARNER') as OrgRole,
    }
  })
}

export async function switchActiveOrg(userId: string, orgId: string): Promise<void> {
  const admin = createServiceRoleSupabaseClient()
  const { data: membership } = await admin
    .from('org_members')
    .select('org_id')
    .eq('user_id', userId)
    .eq('org_id', orgId)
    .maybeSingle()

  if (!membership?.org_id) {
    throw new Error('Forbidden: not a member of this organisation')
  }

  const { error } = await admin
    .from('profiles')
    .update({ org_id: orgId, active_org_id: orgId })
    .eq('id', userId)

  if (error) throw new Error(error.message)
}

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
  const orgId = await getOrCreateOrg(userId)
  const supabase = await createClient()
  const { data: membership } = await supabase
    .from('org_members')
    .select('role')
    .eq('org_id', orgId)
    .eq('user_id', userId)
    .single()
  const role = (membership?.role ?? 'LEARNER') as OrgRole
  return { orgId, role }
}

export async function requireOrgContentEditor(userId: string): Promise<string> {
  if (await isSuperAdmin(userId)) {
    return getOrCreateOrg(userId)
  }
  const { orgId, role } = await getOrgIdAndRole(userId)
  if (role !== 'ADMIN' && role !== 'MANAGER' && role !== 'CREATOR') {
    throw new Error('Forbidden: requires Admin, Manager, or Creator role')
  }
  return orgId
}

export async function requireOrgAdmin(userId: string): Promise<string> {
  if (await isSuperAdmin(userId)) {
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
    throw new Error('Forbidden: requires Super Admin role')
  }
}

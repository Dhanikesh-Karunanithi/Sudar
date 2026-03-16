import { createClient, createAdminClient } from '@/lib/supabase/server'
import { requireSuperAdmin } from '@/lib/org'
import { NextResponse } from 'next/server'

export async function GET() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    await requireSuperAdmin(user.id)
  } catch {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const admin = createAdminClient()

  // List all auth users (single page; OK for current scale)
  const { data: authList, error: listError } = await admin.auth.admin.listUsers()
  if (listError) {
    return NextResponse.json(
      { error: `Failed to list users: ${listError.message}` },
      { status: 500 }
    )
  }

  const authUsers = authList?.users ?? []
  const userIds = authUsers.map((u) => u.id)

  const [{ data: profiles }, { data: memberships }, { data: orgs }] = await Promise.all([
    admin
      .from('profiles')
      .select('id, full_name, role, org_id')
      .in('id', userIds),
    admin
      .from('org_members')
      .select('org_id, user_id, role'),
    admin
      .from('organisations')
      .select('id, name, slug'),
  ])

  const profileById = new Map((profiles ?? []).map((p) => [p.id, p]))
  const orgById = new Map((orgs ?? []).map((o) => [o.id, o]))

  const orgMembershipsByUser = new Map<string, { org_id: string; role: string; org_name: string }[]>()
  for (const m of memberships ?? []) {
    const list = orgMembershipsByUser.get(m.user_id) ?? []
    const org = orgById.get(m.org_id)
    list.push({
      org_id: m.org_id,
      role: m.role,
      org_name: org?.name ?? 'Unknown org',
    })
    orgMembershipsByUser.set(m.user_id, list)
  }

  const result = authUsers.map((u) => {
    const profile = profileById.get(u.id as string) as
      | { id: string; full_name?: string | null; role?: string | null; org_id?: string | null }
      | undefined

    return {
      id: u.id,
      email: u.email,
      status: u.banned_until ? 'disabled' : 'active',
      created_at: u.created_at,
      last_sign_in_at: u.last_sign_in_at,
      full_name: profile?.full_name ?? (u.user_metadata?.full_name as string | null) ?? null,
      profile_role: profile?.role ?? null,
      primary_org_id: profile?.org_id ?? null,
      primary_org_name: profile?.org_id ? (orgById.get(profile.org_id)?.name ?? null) : null,
      memberships: orgMembershipsByUser.get(u.id as string) ?? [],
    }
  })

  return NextResponse.json(result)
}

export async function DELETE(request: Request) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    await requireSuperAdmin(user.id)
  } catch {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = (await request.json().catch(() => null)) as { user_ids?: string[] } | null
  const userIds = Array.isArray(body?.user_ids) ? body!.user_ids : []
  if (userIds.length === 0) {
    return NextResponse.json({ error: 'user_ids array required' }, { status: 400 })
  }

  const admin = createAdminClient()

  // Clean up relational data first
  await admin.from('org_members').delete().in('user_id', userIds)
  await admin.from('learner_profiles').delete().in('user_id', userIds)
  await admin.from('profiles').delete().in('id', userIds)

  const failures: { id: string; error: string }[] = []
  let deleted = 0

  for (const id of userIds) {
    const { error } = await admin.auth.admin.deleteUser(id)
    if (error) {
      failures.push({ id, error: error.message })
    } else {
      deleted++
    }
  }

  return NextResponse.json({
    deleted,
    failures: failures.length ? failures : undefined,
  })
}


import { createClient, createAdminClient } from '@/lib/supabase/server'
import { requireOrgAdmin } from '@/lib/org'
import { NextResponse } from 'next/server'

/**
 * GET /api/users/[id] — Get one user in the current org (Admin/Manager only).
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let orgId: string
  try {
    orgId = await requireOrgAdmin(user.id)
  } catch {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { id } = await params

  const admin = createAdminClient()

  const { data: membership } = await admin
    .from('org_members')
    .select('role')
    .eq('org_id', orgId)
    .eq('user_id', id)
    .single()

  if (!membership) {
    return NextResponse.json({ error: 'User not in this organization' }, { status: 404 })
  }

  const { data: profile } = await admin
    .from('profiles')
    .select('id, full_name')
    .eq('id', id)
    .single()

  const { data: authData } = await admin.auth.admin.getUserById(id)
  const u = authData?.user

  return NextResponse.json({
    id,
    full_name: profile?.full_name ?? u?.user_metadata?.full_name ?? null,
    email: u?.email ?? null,
    org_role: membership.role,
    status: u?.banned_until ? 'disabled' : 'active',
  })
}

/**
 * PATCH /api/users/[id] — Update user (full_name, org_role, banned). Admin/Manager only.
 */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let orgId: string
  try {
    orgId = await requireOrgAdmin(user.id)
  } catch {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { id: targetId } = await params
  const admin = createAdminClient()

  const { data: membership } = await admin
    .from('org_members')
    .select('role')
    .eq('org_id', orgId)
    .eq('user_id', targetId)
    .single()

  if (!membership) {
    return NextResponse.json({ error: 'User not in this organization' }, { status: 404 })
  }

  const body = await request.json() as { full_name?: string; org_role?: string; banned?: boolean }

  if (body.full_name !== undefined) {
    await admin.from('profiles').update({ full_name: body.full_name }).eq('id', targetId)
  }
  const validRoles: Array<'ADMIN' | 'MANAGER' | 'CREATOR' | 'LEARNER'> = ['ADMIN', 'MANAGER', 'CREATOR', 'LEARNER']
  if (body.org_role !== undefined && validRoles.includes(body.org_role as 'ADMIN' | 'MANAGER' | 'CREATOR' | 'LEARNER')) {
    const role = body.org_role as 'ADMIN' | 'MANAGER' | 'CREATOR' | 'LEARNER'
    await admin.from('org_members').update({ role }).eq('org_id', orgId).eq('user_id', targetId)
  }
  if (body.banned !== undefined) {
    await admin.auth.admin.updateUserById(targetId, {
      ban_duration: body.banned ? '876000h' : 'none',
    })
  }

  return NextResponse.json({ ok: true })
}

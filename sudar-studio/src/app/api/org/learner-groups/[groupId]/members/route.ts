import { createClient, createAdminClient } from '@/lib/supabase/server'
import { requireOrgAdmin } from '@/lib/org'
import { NextRequest, NextResponse } from 'next/server'

async function assertGroupInOrg(
  admin: ReturnType<typeof createAdminClient>,
  orgId: string,
  groupId: string
) {
  const { data, error } = await admin
    .from('learner_groups')
    .select('id')
    .eq('id', groupId)
    .eq('org_id', orgId)
    .single()
  return !error && !!data
}

async function assertUserInOrg(
  admin: ReturnType<typeof createAdminClient>,
  orgId: string,
  targetUserId: string
) {
  const { data } = await admin
    .from('org_members')
    .select('user_id')
    .eq('org_id', orgId)
    .eq('user_id', targetUserId)
    .single()
  return !!data
}

/**
 * GET — list member user ids for a group.
 * POST — add member { user_id }
 */
export async function GET(
  _: NextRequest,
  { params }: { params: Promise<{ groupId: string }> }
) {
  const { groupId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  let orgId: string
  try {
    orgId = await requireOrgAdmin(user.id)
  } catch {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const admin = createAdminClient()
  const ok = await assertGroupInOrg(admin, orgId, groupId)
  if (!ok) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const { data: rows, error } = await admin
    .from('learner_group_members')
    .select('user_id')
    .eq('group_id', groupId)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json((rows ?? []).map((r) => r.user_id))
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ groupId: string }> }
) {
  const { groupId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  let orgId: string
  try {
    orgId = await requireOrgAdmin(user.id)
  } catch {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await request.json().catch(() => ({}))
  const targetUserId = typeof body.user_id === 'string' ? body.user_id : ''
  if (!targetUserId) return NextResponse.json({ error: 'user_id required' }, { status: 400 })

  const admin = createAdminClient()
  const ok = await assertGroupInOrg(admin, orgId, groupId)
  if (!ok) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const inOrg = await assertUserInOrg(admin, orgId, targetUserId)
  if (!inOrg) {
    return NextResponse.json({ error: 'User is not a member of this organization' }, { status: 400 })
  }

  const { error } = await admin
    .from('learner_group_members')
    .insert({ group_id: groupId, user_id: targetUserId })

  if (error && !String(error.message).toLowerCase().includes('duplicate')) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  return NextResponse.json({ ok: true })
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ groupId: string }> }
) {
  const { groupId } = await params
  const userId = request.nextUrl.searchParams.get('user_id')
  if (!userId) return NextResponse.json({ error: 'user_id query required' }, { status: 400 })

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  let orgId: string
  try {
    orgId = await requireOrgAdmin(user.id)
  } catch {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const admin = createAdminClient()
  const ok = await assertGroupInOrg(admin, orgId, groupId)
  if (!ok) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const { error } = await admin
    .from('learner_group_members')
    .delete()
    .eq('group_id', groupId)
    .eq('user_id', userId)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return new NextResponse(null, { status: 204 })
}

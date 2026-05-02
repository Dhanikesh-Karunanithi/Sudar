import { createClient, createServiceRoleSupabaseClient } from '@/lib/supabase/server'
import { requireOrgAdmin } from '@/lib/org'
import { NextRequest, NextResponse } from 'next/server'

async function assertGroupInOrg(
  admin: ReturnType<typeof createServiceRoleSupabaseClient>,
  orgId: string,
  groupId: string
) {
  const { data, error } = await admin
    .from('learner_groups')
    .select('id')
    .eq('id', groupId)
    .eq('org_id', orgId)
    .single()
  return { ok: !error && !!data, error }
}

export async function PATCH(
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
  const admin = createServiceRoleSupabaseClient()
  const { ok } = await assertGroupInOrg(admin, orgId, groupId)
  if (!ok) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const updates: Record<string, string | null> = {}
  if (typeof body.name === 'string' && body.name.trim()) updates.name = body.name.trim()
  if (typeof body.description === 'string') updates.description = body.description.trim() || null
  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: 'No valid fields' }, { status: 400 })
  }

  const { data, error } = await admin
    .from('learner_groups')
    .update(updates)
    .eq('id', groupId)
    .select('id, name, description, created_at')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function DELETE(
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

  const admin = createServiceRoleSupabaseClient()
  const { ok } = await assertGroupInOrg(admin, orgId, groupId)
  if (!ok) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const { error } = await admin.from('learner_groups').delete().eq('id', groupId)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return new NextResponse(null, { status: 204 })
}

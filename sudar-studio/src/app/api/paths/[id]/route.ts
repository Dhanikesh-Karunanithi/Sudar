import { createClient, createServiceRoleSupabaseClient } from '@/lib/supabase/server'
import { getOrCreateOrg } from '@/lib/org'
import { getPathForOrg } from '@/lib/paths/verifyPathOrg'
import { NextRequest, NextResponse } from 'next/server'

const ALLOWED_PATCH = ['title', 'description', 'status', 'courses', 'is_adaptive', 'is_mandatory', 'issues_certificate', 'target_skills']

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const admin = createServiceRoleSupabaseClient()
  const orgId = await getOrCreateOrg(user.id)
  const path = await getPathForOrg(admin, id, orgId)
  if (!path) return NextResponse.json({ error: 'Path not found' }, { status: 404 })

  return NextResponse.json(path)
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const admin = createServiceRoleSupabaseClient()
  const orgId = await getOrCreateOrg(user.id)
  const existing = await getPathForOrg(admin, id, orgId, 'id')
  if (!existing) return NextResponse.json({ error: 'Path not found' }, { status: 404 })

  const body = await request.json()
  const updates: Record<string, unknown> = {}
  for (const key of ALLOWED_PATCH) {
    if (key in body) updates[key] = body[key]
  }

  const { data, error } = await admin
    .from('learning_paths')
    .update(updates)
    .eq('id', id)
    .eq('org_id', orgId)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const admin = createServiceRoleSupabaseClient()
  const orgId = await getOrCreateOrg(user.id)
  const existing = await getPathForOrg(admin, id, orgId, 'id')
  if (!existing) return NextResponse.json({ error: 'Path not found' }, { status: 404 })

  const { error } = await admin.from('learning_paths').delete().eq('id', id).eq('org_id', orgId)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return new NextResponse(null, { status: 204 })
}

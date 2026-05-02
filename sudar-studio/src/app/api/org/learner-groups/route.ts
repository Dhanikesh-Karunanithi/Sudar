import { createClient, createServiceRoleSupabaseClient } from '@/lib/supabase/server'
import { requireOrgAdmin } from '@/lib/org'
import { NextRequest, NextResponse } from 'next/server'

/**
 * GET — list learner groups for the admin's org.
 * POST — create a group { name, description? }
 */
export async function GET() {
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
  const { data: groups, error } = await admin
    .from('learner_groups')
    .select('id, name, description, created_at')
    .eq('org_id', orgId)
    .order('name', { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(groups ?? [])
}

export async function POST(request: NextRequest) {
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
  const name = typeof body.name === 'string' ? body.name.trim() : ''
  if (!name) return NextResponse.json({ error: 'name required' }, { status: 400 })
  const description = typeof body.description === 'string' ? body.description.trim() || null : null

  const admin = createServiceRoleSupabaseClient()
  const { data, error } = await admin
    .from('learner_groups')
    .insert({
      org_id: orgId,
      name,
      description,
      created_by: user.id,
    })
    .select('id, name, description, created_at')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}

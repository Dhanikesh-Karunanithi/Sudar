import { createClient, createAdminClient } from '@/lib/supabase/server'
import { requireOrgAdmin } from '@/lib/org'
import { NextResponse } from 'next/server'
import { createPerformanceRecordSchema } from '@/types/performance'

/**
 * GET /api/users/[id]/performance — List performance records for this user in current org. Admin/Manager only.
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

  const { id: userId } = await params

  const admin = createAdminClient()
  const { data: membership } = await admin
    .from('org_members')
    .select('org_id')
    .eq('org_id', orgId)
    .eq('user_id', userId)
    .single()

  if (!membership) {
    return NextResponse.json({ error: 'User not in this organization' }, { status: 404 })
  }

  const { data: records, error } = await admin
    .from('learner_performance_records')
    .select('id, source_type, key, value, value_display, period_start, period_end, recorded_at, created_at')
    .eq('org_id', orgId)
    .eq('user_id', userId)
    .order('period_start', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(records ?? [])
}

/**
 * POST /api/users/[id]/performance — Create a performance record. Admin/Manager only.
 */
export async function POST(
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

  const { id: userId } = await params
  const body = await request.json()
  const parsed = createPerformanceRecordSchema.safeParse({
    ...body,
    org_id: orgId,
    user_id: userId,
  })
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid payload', details: parsed.error.flatten() }, { status: 400 })
  }

  const admin = createAdminClient()
  const { data: membership } = await admin
    .from('org_members')
    .select('org_id')
    .eq('org_id', orgId)
    .eq('user_id', userId)
    .single()

  if (!membership) {
    return NextResponse.json({ error: 'User not in this organization' }, { status: 404 })
  }

  const row = {
    org_id: orgId,
    user_id: userId,
    source_type: parsed.data.source_type,
    key: parsed.data.key,
    value: parsed.data.value,
    value_display: parsed.data.value_display ?? null,
    period_start: parsed.data.period_start ? new Date(parsed.data.period_start).toISOString().slice(0, 10) : null,
    period_end: parsed.data.period_end ? new Date(parsed.data.period_end).toISOString().slice(0, 10) : null,
  }

  const { data: record, error } = await admin
    .from('learner_performance_records')
    .insert(row)
    .select('id, source_type, key, value, value_display, period_start, period_end, recorded_at, created_at')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(record)
}

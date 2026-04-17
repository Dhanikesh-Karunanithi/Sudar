import { createClient, createAdminClient } from '@/lib/supabase/server'
import { requireOrgAdmin } from '@/lib/org'
import { NextResponse } from 'next/server'
import { updatePerformanceRecordSchema } from '@/types/performance'

/**
 * PATCH /api/users/[id]/performance/[recordId] — Update a performance record. Admin/Manager only.
 */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string; recordId: string }> }
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

  const { id: userId, recordId } = await params
  const body = await request.json()
  const parsed = updatePerformanceRecordSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid payload', details: parsed.error.flatten() }, { status: 400 })
  }

  const admin = createAdminClient()
  const { data: existing } = await admin
    .from('learner_performance_records')
    .select('id')
    .eq('id', recordId)
    .eq('org_id', orgId)
    .eq('user_id', userId)
    .single()

  if (!existing) {
    return NextResponse.json({ error: 'Record not found' }, { status: 404 })
  }

  const updates: Record<string, unknown> = {}
  if (parsed.data.value !== undefined) updates.value = parsed.data.value
  if (parsed.data.value_display !== undefined) updates.value_display = parsed.data.value_display
  if (parsed.data.period_start !== undefined) {
    updates.period_start = parsed.data.period_start ? new Date(parsed.data.period_start).toISOString().slice(0, 10) : null
  }
  if (parsed.data.period_end !== undefined) {
    updates.period_end = parsed.data.period_end ? new Date(parsed.data.period_end).toISOString().slice(0, 10) : null
  }

  const { data: record, error } = await admin
    .from('learner_performance_records')
    .update(updates)
    .eq('id', recordId)
    .select('id, source_type, key, value, value_display, period_start, period_end, recorded_at, created_at')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(record)
}

/**
 * DELETE /api/users/[id]/performance/[recordId] — Delete a performance record. Admin/Manager only.
 */
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string; recordId: string }> }
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

  const { id: userId, recordId } = await params
  const admin = createAdminClient()

  const { error } = await admin
    .from('learner_performance_records')
    .delete()
    .eq('id', recordId)
    .eq('org_id', orgId)
    .eq('user_id', userId)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return new Response(null, { status: 204 })
}

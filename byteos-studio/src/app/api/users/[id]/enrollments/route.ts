import { createClient, createAdminClient } from '@/lib/supabase/server'
import { requireOrgAdmin } from '@/lib/org'
import { NextResponse } from 'next/server'

/**
 * GET /api/users/[id]/enrollments — List path enrollments for this user in current org. Admin/Manager only.
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

  const { data: enrollments } = await admin
    .from('enrollments')
    .select('id, path_id, status, progress_pct, due_date, completed_at, created_at')
    .eq('user_id', userId)
    .not('path_id', 'is', null)

  const pathIds: string[] = [...new Set((enrollments ?? []).map((e) => e.path_id).filter((id): id is string => id != null))]
  if (pathIds.length === 0) {
    return NextResponse.json([])
  }

  const { data: paths } = await admin
    .from('learning_paths')
    .select('id, title')
    .in('id', pathIds)
    .eq('org_id', orgId)

  const pathMap = new Map((paths ?? []).map((p) => [p.id, p.title]))
  const list = (enrollments ?? []).map((e) => ({
    ...e,
    path_title: e.path_id ? pathMap.get(e.path_id) ?? null : null,
  }))

  return NextResponse.json(list)
}

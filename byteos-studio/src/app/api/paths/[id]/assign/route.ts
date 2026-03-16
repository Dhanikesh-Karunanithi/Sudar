import { createClient, createAdminClient } from '@/lib/supabase/server'
import { getOrCreateOrg } from '@/lib/org'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: pathId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const admin = createAdminClient()
  const orgId = await getOrCreateOrg(user.id)

  const body = await request.json()
  const { user_ids, due_date } = body as { user_ids: string[]; due_date?: string }
  if (!Array.isArray(user_ids) || user_ids.length === 0) {
    return NextResponse.json({ error: 'user_ids array required' }, { status: 400 })
  }

  const { data: path, error: pathError } = await admin
    .from('learning_paths')
    .select('id, title, courses, org_id')
    .eq('id', pathId)
    .single()

  if (pathError || !path) return NextResponse.json({ error: 'Path not found' }, { status: 404 })
  if (path.org_id !== orgId) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const courses = (path.courses as Array<{ course_id: string; order_index: number; is_mandatory: boolean; title: string }>) ?? []
  const dueDateISO = due_date ? new Date(due_date).toISOString() : null

  const created: string[] = []
  for (const userId of user_ids) {
    const { data: existing } = await admin
      .from('enrollments')
      .select('id')
      .eq('user_id', userId)
      .eq('path_id', pathId)
      .single()

    if (existing) continue

    const personalizedSequence = courses.map((c, i) => ({ ...c, order_index: i, seq_status: 'not_started' }))

    const { data: enrollment, error: enrollError } = await admin
      .from('enrollments')
      .insert({
        user_id: userId,
        path_id: pathId,
        enrolled_by: user.id,
        status: 'not_started',
        progress_pct: 0,
        due_date: dueDateISO,
        personalized_sequence: personalizedSequence,
      })
      .select('id')
      .single()

    if (enrollError) continue
    if (enrollment) created.push(enrollment.id)

    for (const c of courses) {
      const { data: ce } = await admin
        .from('enrollments')
        .select('id')
        .eq('user_id', userId)
        .eq('course_id', c.course_id)
        .single()
      if (!ce) {
        await admin.from('enrollments').insert({
          user_id: userId,
          course_id: c.course_id,
          enrolled_by: user.id,
          status: 'not_started',
          progress_pct: 0,
        })
      }
    }
  }

  return NextResponse.json({ assigned: created.length, enrollment_ids: created })
}

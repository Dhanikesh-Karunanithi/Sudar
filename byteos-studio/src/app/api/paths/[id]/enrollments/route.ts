import { createClient, createAdminClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const admin = createAdminClient()

  const { data: enrollments, error } = await admin
    .from('enrollments')
    .select('id, user_id, status, progress_pct, due_date, completed_at, created_at')
    .eq('path_id', id)
    .not('path_id', 'is', null)
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  if (!enrollments?.length) return NextResponse.json([])

  const userIds = [...new Set(enrollments.map((e) => e.user_id))]
  const { data: profiles } = await admin
    .from('profiles')
    .select('id, full_name')
    .in('id', userIds)

  const profileMap = new Map((profiles ?? []).map((p) => [p.id, p.full_name ?? 'Learner']))

  const list = enrollments.map((e) => ({
    id: e.id,
    user_id: e.user_id,
    full_name: profileMap.get(e.user_id) ?? 'Learner',
    status: e.status,
    progress_pct: e.progress_pct,
    due_date: e.due_date,
    completed_at: e.completed_at,
    created_at: e.created_at,
  }))

  return NextResponse.json(list)
}

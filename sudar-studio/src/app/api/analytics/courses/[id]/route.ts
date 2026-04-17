import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient, createClient } from '@/lib/supabase/server'
import { getOrCreateOrg } from '@/lib/org'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (process.env.ENABLE_ANALYTICS_ENGINE === 'false') {
    return NextResponse.json({ success: false, error: 'Analytics engine disabled' }, { status: 503 })
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })

  const { id: courseId } = await params
  const orgId = await getOrCreateOrg(user.id)
  const admin = createAdminClient()
  const days = Math.max(1, Math.min(90, Number(request.nextUrl.searchParams.get('days') ?? '30')))
  const since = new Date(Date.now() - days * 86400000).toISOString().slice(0, 10)

  const { data: course } = await admin
    .from('courses')
    .select('id, title')
    .eq('id', courseId)
    .eq('org_id', orgId)
    .maybeSingle()

  if (!course) return NextResponse.json({ success: false, error: 'Course not found' }, { status: 404 })

  const [{ data: daily, error: dailyError }, { data: modules, error: modulesError }] = await Promise.all([
    admin
      .from('analytics_daily_course')
      .select('event_date, learners_active, active_learning_secs, idle_secs, total_secs, module_starts, module_completes, drop_off_count, quiz_attempts, avg_quiz_score, engagement_score')
      .eq('org_id', orgId)
      .eq('course_id', courseId)
      .gte('event_date', since)
      .order('event_date', { ascending: true }),
    admin
      .from('analytics_daily_module')
      .select('module_id, event_date, learners_active, active_learning_secs, total_secs, module_completes, drop_off_count, avg_time_to_complete_secs')
      .eq('org_id', orgId)
      .eq('course_id', courseId)
      .gte('event_date', since)
      .order('event_date', { ascending: true }),
  ])

  if (dailyError || modulesError) {
    return NextResponse.json({ success: false, error: dailyError?.message ?? modulesError?.message ?? 'Query failed' }, { status: 500 })
  }

  return NextResponse.json({
    success: true,
    data: {
      course,
      daily: daily ?? [],
      modules: modules ?? [],
    },
  })
}

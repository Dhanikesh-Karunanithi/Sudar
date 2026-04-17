import { createClient, createAdminClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { getOrCreateOrg } from '@/lib/org'

/**
 * GET ?course_id=xxx
 * Returns per-learner, per-module time spent for a course.
 * Used by Analytics "Time per section" view.
 * - module_complete events: duration_secs, payload.active_secs, payload.idle_secs
 * - section_heartbeat: duration_secs, payload.active_secs, payload.total_secs (for incomplete sections)
 */
export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const courseId = request.nextUrl.searchParams.get('course_id')
  if (!courseId) return NextResponse.json({ error: 'course_id required' }, { status: 400 })

  const admin = createAdminClient()
  const orgId = await getOrCreateOrg(user.id)

  const { data: course } = await admin
    .from('courses')
    .select('id, title, estimated_duration_mins')
    .eq('id', courseId)
    .eq('org_id', orgId)
    .single()

  if (!course) return NextResponse.json({ error: 'Course not found' }, { status: 404 })

  const { data: modules } = await admin
    .from('modules')
    .select('id, title, order_index')
    .eq('course_id', courseId)
    .order('order_index', { ascending: true })

  const { data: events } = await admin
    .from('learning_events')
    .select('user_id, module_id, event_type, duration_secs, payload, created_at')
    .eq('course_id', courseId)
    .in('event_type', ['module_complete', 'section_heartbeat'])
    .order('created_at', { ascending: true })

  const { data: profiles } = await admin
    .from('profiles')
    .select('id, full_name')
    .in('id', [...new Set((events ?? []).map((e) => e.user_id))])

  const profileMap = new Map((profiles ?? []).map((p) => [p.id, p.full_name ?? 'Unknown']))
  const moduleCount = modules?.length ?? 1
  const estimatedMinsPerModule = (course.estimated_duration_mins ?? 0) / moduleCount
  const estimatedSecsPerModule = estimatedMinsPerModule * 60
  const skipThresholdSecs = Math.min(30, Math.round(estimatedSecsPerModule * 0.2)) // possible skip if active < 30s or < 20% of estimated
  const overTimeMultiplier = 2.5 // flag if total time > 2.5x estimated

  type ModuleTime = {
    module_id: string
    module_title: string
    order_index: number
    total_secs: number
    active_secs: number
    idle_secs: number
    completed: boolean
    possible_skip: boolean
    over_time: boolean
  }

  type LearnerRow = {
    user_id: string
    name: string
    modules: ModuleTime[]
    any_possible_skip: boolean
    any_over_time: boolean
  }

  const byUserModule = new Map<string, Map<string, { total_secs: number; active_secs: number; completed: boolean }>>()

  for (const e of events ?? []) {
    const mid = e.module_id ?? ''
    if (!mid) continue
    const uid = e.user_id
    if (!byUserModule.has(uid)) byUserModule.set(uid, new Map())
    const byModule = byUserModule.get(uid)!
    const payload = (e.payload as Record<string, unknown>) ?? {}
    const activeSecs = (payload.active_secs as number) ?? e.duration_secs ?? 0
    const totalSecs = e.duration_secs ?? 0
    const completed = e.event_type === 'module_complete'
    const existing = byModule.get(mid)
    if (completed || !existing) {
      byModule.set(mid, {
        total_secs: totalSecs,
        active_secs: activeSecs,
        completed,
      })
    } else if (e.event_type === 'section_heartbeat' && totalSecs > (existing.total_secs ?? 0)) {
      byModule.set(mid, { total_secs: totalSecs, active_secs: activeSecs, completed: false })
    }
  }

  const rows: LearnerRow[] = []
  for (const [userId, byModule] of byUserModule) {
    const moduleTimes: ModuleTime[] = (modules ?? []).map((m) => {
      const t = byModule.get(m.id)
      const totalSecs = t?.total_secs ?? 0
      const activeSecs = t?.active_secs ?? 0
      const idleSecs = Math.max(0, totalSecs - activeSecs)
      const possible_skip = t?.completed === true && activeSecs < skipThresholdSecs && activeSecs > 0
      const over_time = totalSecs > estimatedSecsPerModule * overTimeMultiplier && estimatedSecsPerModule > 0
      return {
        module_id: m.id,
        module_title: m.title,
        order_index: m.order_index,
        total_secs: totalSecs,
        active_secs: activeSecs,
        idle_secs: idleSecs,
        completed: t?.completed ?? false,
        possible_skip: possible_skip,
        over_time: over_time,
      }
    })
    rows.push({
      user_id: userId,
      name: profileMap.get(userId) ?? 'Unknown',
      modules: moduleTimes,
      any_possible_skip: moduleTimes.some((m) => m.possible_skip),
      any_over_time: moduleTimes.some((m) => m.over_time),
    })
  }

  return NextResponse.json({
    course_id: courseId,
    course_title: course.title,
    estimated_duration_mins: course.estimated_duration_mins,
    estimated_secs_per_module: Math.round(estimatedSecsPerModule),
    skip_threshold_secs: skipThresholdSecs,
    modules: modules ?? [],
    learners: rows.sort((a, b) => a.name.localeCompare(b.name)),
  })
}

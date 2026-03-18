import { createClient, createAdminClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

const eventBodySchema = z.object({
  event_type: z.string().min(1).max(80),
  course_id: z.string().uuid().optional().nullable(),
  module_id: z.string().uuid().optional().nullable(),
  payload: z.record(z.unknown()).optional().nullable(),
  modality: z.string().max(30).optional().default('text'),
  duration_secs: z.number().int().min(0).optional().nullable(),
})

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }
  const parsed = eventBodySchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }
  const { event_type, course_id, module_id, payload, modality, duration_secs } = parsed.data

  const admin = createAdminClient()

  await admin.from('learning_events').insert({
    user_id: user.id,
    course_id: course_id ?? null,
    module_id: module_id ?? null,
    event_type,
    payload: payload ?? null,
    modality: modality ?? 'text',
    duration_secs: duration_secs ?? null,
  })

  // On module_complete — update enrollment progress
  if (event_type === 'module_complete' && course_id) {
    const { count: totalModules } = await admin
      .from('modules')
      .select('id', { count: 'exact', head: true })
      .eq('course_id', course_id)

    const { count: completedModules } = await admin
      .from('learning_events')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('course_id', course_id)
      .eq('event_type', 'module_complete')

    if (totalModules && completedModules !== null) {
      const progress = Math.min(100, Math.round((completedModules / totalModules) * 100))
      const status = progress >= 100 ? 'completed' : 'in_progress'

      await admin
        .from('enrollments')
        .update({
          progress_pct: progress,
          status,
          ...(status === 'in_progress' && { started_at: new Date().toISOString() }),
          ...(status === 'completed' && { completed_at: new Date().toISOString() }),
        })
        .eq('user_id', user.id)
        .eq('course_id', course_id)

      // Sync path progress: any path enrollment that includes this course gets its progress_pct recomputed
      const { data: pathEnrollmentsForSync } = await admin
        .from('enrollments')
        .select('id, path_id, personalized_sequence')
        .eq('user_id', user.id)
        .not('path_id', 'is', null)

      for (const pe of pathEnrollmentsForSync ?? []) {
        const seq = (pe.personalized_sequence as Array<{ course_id: string }>) ?? []
        const courseIdsInPath = seq.map((c) => c.course_id).filter(Boolean)
        if (!courseIdsInPath.includes(course_id)) continue

        const { data: courseStatuses } = await admin
          .from('enrollments')
          .select('course_id, status')
          .eq('user_id', user.id)
          .in('course_id', courseIdsInPath)

        const totalInPath = courseIdsInPath.length
        const completedInPath = (courseStatuses ?? []).filter((e) => e.status === 'completed').length
        const pathProgressPct = totalInPath ? Math.round((completedInPath / totalInPath) * 100) : 0

        await admin
          .from('enrollments')
          .update({ progress_pct: pathProgressPct })
          .eq('id', pe.id)
      }
    }
  }

  // On quiz_attempt — feed wrong topics into learner memory as struggles
  if (event_type === 'quiz_attempt' && payload?.wrong_topics?.length > 0) {
    const { data: profile } = await admin
      .from('learner_profiles')
      .select('ai_tutor_context')
      .eq('user_id', user.id)
      .single()

    const existing = (profile?.ai_tutor_context as Record<string, unknown>) ?? {}
    const currentStruggles = (existing.struggles_with as string[]) ?? []
    const newTopics = (payload.wrong_topics as string[]).filter((t: string) => !currentStruggles.includes(t))

    if (newTopics.length > 0) {
      const updated = {
        ...existing,
        struggles_with: [...currentStruggles, ...newTopics].slice(-15),
        last_updated: new Date().toISOString(),
      }
      await admin
        .from('learner_profiles')
        .update({ ai_tutor_context: updated })
        .eq('user_id', user.id)
    }
  }

  // Refresh next best action after meaningful learning milestones (fire-and-forget)
  if (event_type === 'module_complete' || event_type === 'quiz_attempt') {
    const baseUrl = request.nextUrl.origin
    fetch(`${baseUrl}/api/intelligence/next-action`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: request.headers.get('cookie') ?? '' },
      body: JSON.stringify({ force: false }),
    }).catch(() => {})
  }

  // On course_complete — check if all mandatory courses in any enrolled path are done → issue cert
  if (event_type === 'module_complete' && course_id) {
    const { data: courseEnrollment } = await admin
      .from('enrollments')
      .select('status')
      .eq('user_id', user.id)
      .eq('course_id', course_id)
      .single()

    if (courseEnrollment?.status === 'completed') {
      // Find any path enrollments for this learner
      const { data: pathEnrollments } = await admin
        .from('enrollments')
        .select('id, path_id, personalized_sequence, status')
        .eq('user_id', user.id)
        .not('path_id', 'is', null)
        .neq('status', 'completed')

      for (const pe of pathEnrollments ?? []) {
        const seq = (pe.personalized_sequence as Array<{ course_id: string; is_mandatory: boolean }>) ?? []
        const mandatoryCourseIds = seq.filter((c) => c.is_mandatory).map((c) => c.course_id)
        if (mandatoryCourseIds.length === 0) continue

        // Check completion of all mandatory courses
        const { data: mandatoryStatuses } = await admin
          .from('enrollments')
          .select('course_id, status')
          .eq('user_id', user.id)
          .in('course_id', mandatoryCourseIds)

        const allDone = mandatoryCourseIds.every(
          (cid) => mandatoryStatuses?.find((e) => e.course_id === cid)?.status === 'completed'
        )

        if (!allDone) continue

        // Compute path progress
        const totalCourses = seq.length || 1
        const { data: allStatuses } = await admin
          .from('enrollments')
          .select('course_id, status')
          .eq('user_id', user.id)
          .in('course_id', seq.map((c) => c.course_id))
        const completedCount = (allStatuses ?? []).filter((e) => e.status === 'completed').length
        const progress = Math.round((completedCount / totalCourses) * 100)

        await admin
          .from('enrollments')
          .update({ status: 'completed', progress_pct: progress, completed_at: new Date().toISOString() })
          .eq('id', pe.id)

        // Issue certificate if path issues one
        const { data: pathData } = await admin
          .from('learning_paths')
          .select('issues_certificate')
          .eq('id', pe.path_id)
          .single()

        if (pathData?.issues_certificate) {
          const baseUrl = request.nextUrl.origin
          fetch(`${baseUrl}/api/certificates/issue`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Cookie: request.headers.get('cookie') ?? '' },
            body: JSON.stringify({ path_id: pe.path_id }),
          }).catch(() => {})
        }
      }
    }
  }

  return NextResponse.json({ ok: true })
}

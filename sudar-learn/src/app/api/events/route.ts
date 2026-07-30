import { createClient, createServiceRoleSupabaseClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import type { Json } from '@/types/database'
import { computeCourseEnrollmentProgress } from '@/lib/enrollment/courseEnrollmentProgress'
import { recordStruggleTopics } from '@/lib/learner/syncTopicSkills'
import { evaluateGamification } from '@/lib/gamification/engine'

const eventTypeEnum = z.enum([
  'module_start',
  'module_complete',
  'quiz_attempt',
  'video_play',
  'video_pause',
  'video_replay',
  'section_heartbeat',
  'ai_tutor_open',
  'ai_tutor_query',
  'modality_switch',
  'session_end',
  'drop_off',
  'streak_broken',
  'streak_maintained',
  'read_along_start',
  'read_along_complete',
  'inactivity_warning_started',
  'inactivity_warning_cancelled',
  'inactivity_hibernated',
  'inactivity_resumed',
  'scorm_progress',
  'sim_start',
  'sim_channel_switch',
  'sim_crm_action',
  'sim_complete',
  'sim_retry',
  'sim_rubric_dimension',
  'coach_report_viewed',
])

const eventBodySchema = z.object({
  event_type: eventTypeEnum,
  course_id: z.string().uuid().optional().nullable(),
  module_id: z.string().uuid().optional().nullable(),
  payload: z.record(z.string(), z.unknown()).optional().nullable(),
  modality: z.enum(['text', 'video', 'audio', 'mindmap', 'flashcards', 'game', 'feed', 'podcast', 'reading', 'listening', 'sudarsim']).optional().default('text'),
  duration_secs: z.number().int().min(0).optional().nullable(),
})

function validateEventSemantics(
  eventType: z.infer<typeof eventTypeEnum>,
  payload: Record<string, unknown> | null | undefined,
  durationSecs: number | null | undefined
): string | null {
  const data = payload ?? {}
  const activeSecs =
    typeof data.active_secs === 'number' && Number.isFinite(data.active_secs)
      ? data.active_secs
      : null
  const totalSecs =
    typeof data.total_secs === 'number' && Number.isFinite(data.total_secs)
      ? data.total_secs
      : null

  if (eventType === 'section_heartbeat') {
    if (durationSecs === null || durationSecs === undefined || durationSecs < 0) {
      return 'section_heartbeat requires duration_secs'
    }
    if (activeSecs === null || totalSecs === null) {
      return 'section_heartbeat requires payload.active_secs and payload.total_secs'
    }
    if (activeSecs > totalSecs) {
      return 'section_heartbeat active_secs cannot exceed total_secs'
    }
  }

  if (eventType === 'session_end') {
    if (durationSecs === null || durationSecs === undefined || durationSecs < 0) {
      return 'session_end requires duration_secs'
    }
    if (activeSecs === null) {
      return 'session_end requires payload.active_secs'
    }
    if (typeof data.reason !== 'string' || !data.reason.trim()) {
      return 'session_end requires payload.reason'
    }
  }

  if (eventType === 'drop_off') {
    if (durationSecs === null || durationSecs === undefined || durationSecs < 0) {
      return 'drop_off requires duration_secs'
    }
    if (activeSecs === null) {
      return 'drop_off requires payload.active_secs'
    }
    if (data.completed !== false) {
      return 'drop_off requires payload.completed=false'
    }
  }

  if (eventType === 'modality_switch') {
    const fromModality = data.from_modality
    const toModality = data.to_modality
    if (typeof fromModality !== 'string' || typeof toModality !== 'string') {
      return 'modality_switch requires payload.from_modality and payload.to_modality'
    }
    const ci = data.content_intent
    if (ci !== undefined && ci !== null && typeof ci !== 'string') {
      return 'modality_switch payload.content_intent must be a string when set'
    }
    if (
      typeof ci === 'string' &&
      !['conceptual', 'procedural', 'review', 'assessment'].includes(ci)
    ) {
      return 'modality_switch content_intent must be conceptual, procedural, review, or assessment'
    }
  }

  return null
}

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

  const semanticsError = validateEventSemantics(event_type, payload ?? null, duration_secs)
  if (semanticsError) {
    return NextResponse.json({ error: semanticsError }, { status: 400 })
  }

  const admin = createServiceRoleSupabaseClient()

  const { error: insertError } = await admin.from('learning_events').insert({
    user_id: user.id,
    course_id: course_id ?? null,
    module_id: module_id ?? null,
    event_type,
    payload: (payload ?? null) as Json,
    modality: modality ?? 'text',
    duration_secs: duration_secs ?? null,
  })
  if (insertError) {
    return NextResponse.json({ ok: false, error: insertError.message }, { status: 500 })
  }

  // On module_complete — update enrollment progress
  if (event_type === 'module_complete' && course_id) {
    const enrollmentProgress = await computeCourseEnrollmentProgress(admin, user.id, course_id)

    if (enrollmentProgress) {
      const { progress, status } = enrollmentProgress

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
  const quizPayload = payload as Record<string, unknown> | null | undefined
  const wrongTopics =
    Array.isArray(quizPayload?.wrong_topics) ? (quizPayload.wrong_topics as unknown[]).filter((t): t is string => typeof t === 'string') : []
  if (event_type === 'quiz_attempt' && wrongTopics.length > 0) {
    const { data: profile } = await admin
      .from('learner_profiles')
      .select('ai_tutor_context')
      .eq('user_id', user.id)
      .single()

    const existing = (profile?.ai_tutor_context as Record<string, unknown>) ?? {}
    const currentStruggles = (existing.struggles_with as string[]) ?? []
    const newTopics = wrongTopics.filter((t: string) => !currentStruggles.includes(t))

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

    if (course_id && wrongTopics.length > 0) {
      const { data: courseRow } = await admin.from('courses').select('org_id').eq('id', course_id).maybeSingle()
      if (courseRow?.org_id) {
        void recordStruggleTopics(admin, user.id, courseRow.org_id, wrongTopics)
      }
    }
  }

  // Refresh twin rollups + next best action after meaningful learning milestones (fire-and-forget)
  const rollupTriggers = new Set([
    'module_complete',
    'quiz_attempt',
    'session_end',
    'modality_switch',
    'video_play',
    'video_pause',
    'drop_off',
    'inactivity_warning_started',
    'inactivity_hibernated',
    'inactivity_resumed',
  ])
  if (rollupTriggers.has(event_type)) {
    const baseUrl = request.nextUrl.origin
    const cookie = request.headers.get('cookie') ?? ''
    fetch(`${baseUrl}/api/learner/twin-rollup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: cookie },
      body: JSON.stringify({ force: false }),
    }).catch(() => {})
  }

  if (event_type === 'module_complete' || event_type === 'quiz_attempt') {
    const baseUrl = request.nextUrl.origin
    fetch(`${baseUrl}/api/intelligence/next-action`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: request.headers.get('cookie') ?? '' },
      body: JSON.stringify({ force: false }),
    }).catch(() => {})
  }

  // Gamification engine — fire-and-forget after every event
  evaluateGamification({
    userId: user.id,
    eventType: event_type,
    courseId: course_id ?? null,
    moduleId: module_id ?? null,
    payload: (payload as Record<string, unknown>) ?? {},
    origin: request.nextUrl.origin,
    cookieHeader: request.headers.get('cookie') ?? '',
  }).catch(() => {})

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
        if (!pe.path_id) continue
        const pathId = pe.path_id
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
          .eq('id', pathId)
          .single()

        if (pathData?.issues_certificate) {
          const baseUrl = request.nextUrl.origin
          const internalHeaders: Record<string, string> = { 'Content-Type': 'application/json' }
          const internalSecret = process.env.INTERNAL_SERVICE_SECRET?.trim()
          if (internalSecret) {
            internalHeaders.Authorization = `Bearer ${internalSecret}`
          }
          fetch(`${baseUrl}/api/certificates/issue`, {
            method: 'POST',
            headers: { ...internalHeaders, Cookie: request.headers.get('cookie') ?? '' },
            body: JSON.stringify({ path_id: pathId }),
          }).catch(() => {})
        }
      }
    }
  }

  return NextResponse.json({ ok: true })
}

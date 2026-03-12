/**
 * ALP (Adaptive Learning Layer) — Event ingestion for SudarMemory.
 * External LMSs (e.g. Moodle) POST batches of learning events here.
 * Auth: x-alp-api-key or Authorization: Bearer (env ALP_API_KEY or org key from integration_api_keys).
 * See docs/ALP_API.md for the contract.
 */
import { createAdminClient } from '@/lib/supabase/server'
import { validateAlpKey, getAlpKeyFromRequest } from '@/lib/alp-auth'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  const key = getAlpKeyFromRequest(request)
  const auth = await validateAlpKey(key)
  if (!auth.valid) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: { user_id: string; events: Array<{ event_type: string; course_id?: string; module_id?: string; payload?: unknown; modality?: string; duration_secs?: number }> }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const { user_id, events } = body
  if (!user_id || !Array.isArray(events) || events.length === 0) {
    return NextResponse.json({ error: 'user_id and non-empty events array required' }, { status: 400 })
  }

  const admin = createAdminClient()

  for (const ev of events) {
    const { event_type, course_id, module_id, payload, modality, duration_secs } = ev
    if (!event_type) continue

    await admin.from('learning_events').insert({
      user_id,
      course_id: course_id ?? null,
      module_id: module_id ?? null,
      event_type,
      payload: payload ?? null,
      modality: modality ?? 'text',
      duration_secs: duration_secs ?? null,
    })
  }

  // Side-effects for first event that triggers them (same as internal events route)
  const first = events[0]
  if (first?.event_type === 'module_complete' && first.course_id) {
    const course_id = first.course_id
    const { count: totalModules } = await admin
      .from('modules')
      .select('id', { count: 'exact', head: true })
      .eq('course_id', course_id)

    const { count: completedModules } = await admin
      .from('learning_events')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user_id)
      .eq('course_id', course_id)
      .eq('event_type', 'module_complete')

    if (totalModules != null && completedModules != null && totalModules > 0) {
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
        .eq('user_id', user_id)
        .eq('course_id', course_id)

      const { data: pathEnrollmentsForSync } = await admin
        .from('enrollments')
        .select('id, path_id, personalized_sequence')
        .eq('user_id', user_id)
        .not('path_id', 'is', null)

      for (const pe of pathEnrollmentsForSync ?? []) {
        const seq = (pe.personalized_sequence as Array<{ course_id: string }>) ?? []
        const courseIdsInPath = seq.map((c) => c.course_id).filter(Boolean)
        if (!courseIdsInPath.includes(course_id)) continue

        const { data: courseStatuses } = await admin
          .from('enrollments')
          .select('course_id, status')
          .eq('user_id', user_id)
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

  if (first?.event_type === 'quiz_attempt' && first.payload && typeof first.payload === 'object' && 'wrong_topics' in first.payload) {
    const wrongTopics = (first.payload as { wrong_topics?: string[] }).wrong_topics
    if (Array.isArray(wrongTopics) && wrongTopics.length > 0) {
      const { data: profile } = await admin
        .from('learner_profiles')
        .select('ai_tutor_context')
        .eq('user_id', user_id)
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
          .eq('user_id', user_id)
      }
    }
  }

  return NextResponse.json({ ok: true, inserted: events.length })
}

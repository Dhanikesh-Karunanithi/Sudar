/**
 * ALP (Adaptive Learning Layer) — Event ingestion for SudarMemory.
 * External LMSs (e.g. Moodle) POST batches of learning events here.
 * Auth: x-alp-api-key or Authorization: Bearer (env ALP_API_KEY or org key from integration_api_keys).
 * See docs/ALP_API.md for the contract.
 */
import { createServiceRoleSupabaseClient } from '@/lib/supabase/server'
import { validateAlpKey, getAlpKeyFromRequest, rejectAlpUserOutsideOrg } from '@/lib/alp-auth'
import { syncEnrollmentProgressAfterModuleComplete } from '@/lib/learner/enrollmentProgress'
import type { Json } from '@/types/database'
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

  const admin = createServiceRoleSupabaseClient()
  const orgError = await rejectAlpUserOutsideOrg(admin, auth, user_id)
  if (orgError) return orgError

  for (const ev of events) {
    const { event_type, course_id, module_id, payload, modality, duration_secs } = ev
    if (!event_type) continue

    await admin.from('learning_events').insert({
      user_id,
      course_id: course_id ?? null,
      module_id: module_id ?? null,
      event_type,
      payload: (payload ?? null) as Json,
      modality: modality ?? 'text',
      duration_secs: duration_secs ?? null,
    })
  }

  const completedCourseIds = [
    ...new Set(
      events
        .filter((ev) => ev.event_type === 'module_complete' && ev.course_id)
        .map((ev) => ev.course_id as string),
    ),
  ]
  for (const course_id of completedCourseIds) {
    await syncEnrollmentProgressAfterModuleComplete(admin, user_id, course_id)
  }

  for (const ev of events) {
    if (ev.event_type !== 'quiz_attempt' || !ev.payload || typeof ev.payload !== 'object') continue
    if (!('wrong_topics' in ev.payload)) continue

    const wrongTopics = (ev.payload as { wrong_topics?: string[] }).wrong_topics
    if (!Array.isArray(wrongTopics) || wrongTopics.length === 0) continue

    const { data: profile } = await admin
      .from('learner_profiles')
      .select('ai_tutor_context')
      .eq('user_id', user_id)
      .single()

    const existing = (profile?.ai_tutor_context as Record<string, unknown>) ?? {}
    const currentStruggles = (existing.struggles_with as string[]) ?? []
    const newTopics = wrongTopics.filter((t: string) => !currentStruggles.includes(t))

    if (newTopics.length === 0) continue

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

  return NextResponse.json({ ok: true, inserted: events.length })
}

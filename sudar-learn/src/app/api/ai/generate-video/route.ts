/**
 * Generate a SudarVid slide deck for the Watch modality.
 * Proxies to the SudarVid FastAPI service (`SUDARVID_URL`, repo folder `sudar_vid`).
 * Maps Sudar module data to SudarVid GenerateRequest curriculum fields.
 */
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { rejectSensitiveLearnerAiInput } from '@/lib/security/learnerAiInputGuard'
import { getSudarVidBaseUrl } from '@/lib/sudarvid'

const SUDARVID_URL = getSudarVidBaseUrl()

function extractPlainText(content: unknown): string {
  if (!content || typeof content !== 'object') return ''
  const c = content as Record<string, unknown>
  if (typeof c.body === 'string') return c.body
  const parts: string[] = []
  if (typeof c.introduction === 'string') parts.push(c.introduction)
  if (Array.isArray(c.sections)) {
    for (const s of c.sections) {
      if (typeof s === 'object' && s !== null) {
        const sec = s as Record<string, string>
        if (sec.heading) parts.push(sec.heading)
        if (sec.content) parts.push(sec.content)
      }
    }
  }
  if (typeof c.summary === 'string') parts.push(c.summary)
  return parts.join('\n\n')
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json().catch(() => ({}))
  const moduleId = typeof body.module_id === 'string' ? body.module_id.trim() : ''
  const courseId = typeof body.course_id === 'string' ? body.course_id.trim() : ''
  const regenerate = (body && typeof body.regenerate === 'object' && body.regenerate !== null)
    ? body.regenerate as {
      reason?: string
      goals?: string[]
      notes?: string
    }
    : null
  if (!moduleId || !courseId) {
    return NextResponse.json({ error: 'module_id and course_id are required' }, { status: 400 })
  }

  const admin = createAdminClient()

  const { data: module } = await admin
    .from('modules')
    .select('id, title, content')
    .eq('id', moduleId)
    .single()

  if (!module) {
    return NextResponse.json({ error: 'Module not found' }, { status: 404 })
  }

  const contentText = extractPlainText(module.content)
  const regenerateReason = typeof regenerate?.reason === 'string' ? regenerate.reason.trim() : ''
  const regenerateGoals = Array.isArray(regenerate?.goals)
    ? regenerate.goals.filter((g): g is string => typeof g === 'string').map((g) => g.trim()).filter(Boolean)
    : []
  const regenerateNotes = typeof regenerate?.notes === 'string' ? regenerate.notes.trim() : ''

  if (regenerate) {
    const { count } = await admin
      .from('learning_events')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('course_id', courseId)
      .eq('module_id', moduleId)
      .eq('event_type', 'video_regenerate_request')

    if ((count ?? 0) >= 2) {
      return NextResponse.json(
        { error: 'Regenerate limit reached for this video. You can regenerate up to 2 times.' },
        { status: 429 }
      )
    }
  }

  const blockedVid = await rejectSensitiveLearnerAiInput(admin, user.id, [module.title, contentText])
  if (blockedVid) return blockedVid

  const regenerateInstruction = regenerate
    ? [
      'Regenerate guidance from learner:',
      regenerateReason ? `Reason: ${regenerateReason}` : null,
      regenerateGoals.length ? `Requested improvements: ${regenerateGoals.join(', ')}` : null,
      regenerateNotes ? `Additional notes: ${regenerateNotes}` : null,
      'Keep timing and captions tightly aligned with spoken narration.',
    ].filter(Boolean).join('\n')
    : ''

  const generateBody = {
    topic: module.title,
    audience: 'professional learner',
    language: 'en',
    theme: 'seminar_minimal',
    slide_count: 6,
    video_size: { width: 1920, height: 1080 },
    animation_level: 'medium',
    include_tts: true,
    include_music: false,
    output_html: true,
    output_mp4: false,
    source_notes: [contentText.slice(0, 11000), regenerateInstruction].filter(Boolean).join('\n\n') || undefined,
  }

  try {
    const res = await fetch(`${SUDARVID_URL}/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(generateBody),
    })

    if (!res.ok) {
      const detail = await res.text()
      return NextResponse.json({ error: detail || res.statusText }, { status: res.status })
    }

    const data = await res.json()
    const jobId: string = data.job_id

    if (regenerate) {
      admin.from('learning_events').insert({
        user_id: user.id,
        course_id: courseId,
        module_id: moduleId,
        event_type: 'video_regenerate_request',
        modality: 'video',
        payload: {
          reason: regenerateReason || null,
          goals: regenerateGoals,
          has_notes: Boolean(regenerateNotes),
          source: 'sudar-guided',
        },
      }).then(() => {}).catch(() => {})
    }

    admin.from('learning_events').insert({
      user_id: user.id,
      course_id: courseId,
      module_id: moduleId,
      event_type: 'video_generate_start',
      modality: 'video',
      payload: { job_id: jobId, source: 'sudarvid' },
    }).then(() => {}).catch(() => {})

    return NextResponse.json({ job_id: jobId, status: 'queued' })
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to reach video generation service' },
      { status: 502 }
    )
  }
}

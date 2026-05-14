import { createClient, createServiceRoleSupabaseClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { rejectCrossSiteRequest } from '@/lib/security/sameOrigin'
import type { Json } from '@/types/database'

const SUDARVID_URL = process.env.SUDARVID_URL ?? 'http://localhost:8000'

const GenerateVideoBodySchema = z.object({
  course_id: z.string().min(1),
  module_id: z.string().min(1),
  video_preset: z.enum(['standard', 'rich']).optional(),
})

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

function normalizeEngineMode(videoPreset: 'standard' | 'rich' | undefined): 'classic' | 'premium' {
  return videoPreset === 'rich' ? 'premium' : 'classic'
}

export async function POST(request: NextRequest) {
  const originError = rejectCrossSiteRequest(request)
  if (originError) return originError

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const raw = await request.json().catch(() => null)
  const parsed = GenerateVideoBodySchema.safeParse(raw)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Invalid request body' }, { status: 400 })
  }

  const { course_id, module_id, video_preset } = parsed.data
  const engine_mode = normalizeEngineMode(video_preset)

  const admin = createServiceRoleSupabaseClient()

  // Studio RBAC (minimal): allow generation only for courses created by the current studio user.
  const { data: courseRow, error: courseError } = await admin
    .from('courses')
    .select('id')
    .eq('id', course_id)
    .eq('created_by', user.id)
    .maybeSingle()
  if (courseError) return NextResponse.json({ error: courseError.message }, { status: 404 })
  if (!courseRow) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { data: moduleRow } = await admin
    .from('modules')
    .select('id, title, content')
    .eq('id', module_id)
    .eq('course_id', course_id)
    .maybeSingle()
  if (!moduleRow) return NextResponse.json({ error: 'Module not found' }, { status: 404 })

  const contentText = extractPlainText(moduleRow.content)
  const sourceNotes = contentText.slice(0, 11000) || undefined

  const generateBody = {
    topic: moduleRow.title,
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
    source_notes: sourceNotes,
    engine_mode,
  }

  try {
    const res = await fetch(`${SUDARVID_URL.replace(/\/$/, '')}/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(generateBody),
    })
    if (!res.ok) {
      const detail = await res.text()
      return NextResponse.json({ error: detail || res.statusText }, { status: res.status })
    }

    const data = (await res.json()) as { job_id?: string; meta?: Record<string, unknown>; status?: string }
    if (!data.job_id) return NextResponse.json({ error: 'SudarVid did not return a job id' }, { status: 502 })

    // Create job ownership event so SudarVid job proxies can authorize this job for the current user.
    await admin.from('learning_events').insert({
      user_id: user.id,
      course_id,
      module_id,
      event_type: 'video_generate_start',
      modality: 'video',
      payload: {
        job_id: data.job_id,
        source: 'sudarvid',
        transport: 'http',
        requested_engine_mode: engine_mode,
        engine_mode,
        requested_video_preset: video_preset ?? 'standard',
        meta: data.meta ?? {},
      } as Json,
    })

    return NextResponse.json({
      job_id: data.job_id,
      status: data.status ?? 'queued',
      engine_mode,
      video_preset: video_preset ?? 'standard',
      meta: data.meta ?? {},
    })
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to reach video generation service' },
      { status: 502 },
    )
  }
}


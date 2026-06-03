import { createServiceRoleSupabaseClient } from '@/lib/supabase/server'
import { getRequestSession } from '@/lib/auth/requestSession'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { recordExternalCourseEngagement } from '@/lib/external/externalCourseContext'

const bodySchema = z.object({
  course_id: z.string().uuid(),
  event_type: z.enum(['view', 'click', 'duration', 'complete']),
  duration_secs: z.number().int().min(0).optional(),
})

export async function POST(request: NextRequest) {
  const session = await getRequestSession(request)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const parsed = bodySchema.safeParse(await request.json().catch(() => ({})))
  if (!parsed.success) return NextResponse.json({ error: 'Invalid body' }, { status: 400 })

  const admin = createServiceRoleSupabaseClient()
  const { course_id, event_type, duration_secs } = parsed.data

  const patch =
    event_type === 'view'
      ? { views: 1, last_visited: new Date().toISOString() }
      : event_type === 'click'
        ? { clicks: 1, last_visited: new Date().toISOString() }
        : event_type === 'duration'
          ? { duration_secs: duration_secs ?? 0, last_visited: new Date().toISOString() }
          : { completed: true, last_visited: new Date().toISOString() }

  await recordExternalCourseEngagement(admin, session.user.id, course_id, patch)

  if (event_type !== 'click') {
    await admin.from('learning_events').insert({
      user_id: session.user.id,
      course_id,
      event_type: event_type === 'complete' ? 'module_complete' : 'module_start',
      modality: 'text',
      duration_secs: duration_secs ?? null,
      payload: { source: 'external_course', external_event: event_type },
    })
  }

  return NextResponse.json({ ok: true })
}

import { createClient, createServiceRoleSupabaseClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { evaluateGamification } from '@/lib/gamification/engine'

const bodySchema = z.object({
  eventType: z.string().min(1).max(80),
  courseId: z.string().uuid().optional().nullable(),
  moduleId: z.string().uuid().optional().nullable(),
  payload: z.record(z.unknown()).optional().default({}),
  modality: z.string().max(30).optional().default('text'),
  durationSecs: z.number().int().min(0).optional().nullable(),
})

/**
 * POST /api/quests/progress
 * Emits quest-related or milestone events and evaluates gamification immediately.
 */
export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json().catch(() => null)
  const parsed = bodySchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid body', issues: parsed.error.issues }, { status: 400 })
  }

  const { eventType, courseId, moduleId, payload, modality, durationSecs } = parsed.data
  const admin = createServiceRoleSupabaseClient()

  await admin.from('learning_events').insert({
    user_id: user.id,
    course_id: courseId ?? null,
    module_id: moduleId ?? null,
    event_type: eventType,
    payload,
    modality,
    duration_secs: durationSecs ?? null,
  })

  const result = await evaluateGamification({
    userId: user.id,
    eventType,
    courseId: courseId ?? null,
    moduleId: moduleId ?? null,
    payload,
    origin: request.nextUrl.origin,
    cookieHeader: request.headers.get('cookie') ?? '',
  })

  return NextResponse.json({ success: true, data: result })
}


import { createServiceRoleSupabaseClient } from '@/lib/supabase/server'
import { authorizeInternalService } from '@/lib/security/internalServiceAuth'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { evaluateGamification } from '@/lib/gamification/engine'

const bodySchema = z.object({
  userId: z.string().uuid(),
  eventType: z.string().min(1).max(80),
  courseId: z.string().uuid().optional().nullable(),
  moduleId: z.string().uuid().optional().nullable(),
  payload: z.record(z.unknown()).optional().default({}),
  modality: z.string().max(30).optional().default('text'),
  durationSecs: z.number().int().min(0).optional().nullable(),
})

/**
 * POST /api/quests/progress
 * Internal route for server-side quest/milestone events and immediate gamification evaluation.
 */
export async function POST(request: NextRequest) {
  if (!authorizeInternalService(request)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await request.json().catch(() => null)
  const parsed = bodySchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid body', issues: parsed.error.issues }, { status: 400 })
  }

  const { userId, eventType, courseId, moduleId, payload, modality, durationSecs } = parsed.data
  const admin = createServiceRoleSupabaseClient()

  await admin.from('learning_events').insert({
    user_id: userId,
    course_id: courseId ?? null,
    module_id: moduleId ?? null,
    event_type: eventType,
    payload,
    modality,
    duration_secs: durationSecs ?? null,
  })

  const result = await evaluateGamification({
    userId,
    eventType,
    courseId: courseId ?? null,
    moduleId: moduleId ?? null,
    payload,
    origin: request.nextUrl.origin,
    cookieHeader: request.headers.get('cookie') ?? '',
  })

  return NextResponse.json({ success: true, data: result })
}

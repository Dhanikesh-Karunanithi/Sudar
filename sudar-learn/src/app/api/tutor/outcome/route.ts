/**
 * Log when the learner takes an action from a Sudar suggestion (e.g. Enroll, Continue, Review).
 * Used so the agent can learn from outcomes and adapt future suggestions.
 */
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

const outcomeBodySchema = z
  .object({
    course_id: z.string().uuid().optional(),
    path_id: z.string().uuid().optional(),
    action_label: z.string().trim().min(1).max(80).optional(),
  })
  .refine((val) => Boolean(val.course_id || val.path_id), {
    message: 'course_id or path_id is required',
  })

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    let body: z.infer<typeof outcomeBodySchema>
    try {
      const payload = await request.json()
      const parsed = outcomeBodySchema.safeParse(payload)
      if (!parsed.success) {
        return NextResponse.json({ error: 'Invalid body' }, { status: 400 })
      }
      body = parsed.data
    } catch {
      return NextResponse.json({ error: 'Invalid body' }, { status: 400 })
    }
    const { course_id, path_id, action_label } = body

    const admin = createAdminClient()
    await admin.from('learning_events').insert({
      user_id: user.id,
      course_id: course_id ?? null,
      module_id: null,
      event_type: 'tutor_action_taken',
      payload: { path_id: path_id ?? null, action_label: action_label ?? null },
      modality: 'text',
      duration_secs: null,
    })
    return NextResponse.json({ ok: true })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

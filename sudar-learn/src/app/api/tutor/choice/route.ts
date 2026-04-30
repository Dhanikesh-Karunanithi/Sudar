/**
 * Logs inline tutor clarification choice (tap-to-reply) for analytics and adaptation.
 */
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { rejectCrossSiteRequest } from '@/lib/security/sameOrigin'

const bodySchema = z.object({
  block_id: z.string().trim().min(1).max(64),
  choice_id: z.string().trim().min(1).max(32),
  label: z.string().trim().max(120).optional(),
  course_id: z.string().uuid().optional(),
  module_id: z.string().uuid().optional(),
})

export async function POST(request: NextRequest) {
  const badOrigin = rejectCrossSiteRequest(request)
  if (badOrigin) return badOrigin
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    let body: z.infer<typeof bodySchema>
    try {
      const parsed = bodySchema.safeParse(await request.json())
      if (!parsed.success) {
        return NextResponse.json({ error: 'Invalid body' }, { status: 400 })
      }
      body = parsed.data
    } catch {
      return NextResponse.json({ error: 'Invalid body' }, { status: 400 })
    }

    const admin = createAdminClient()
    await admin.from('learning_events').insert({
      user_id: user.id,
      course_id: body.course_id ?? null,
      module_id: body.module_id ?? null,
      event_type: 'tutor_choice_selected',
      modality: 'text',
      payload: {
        block_id: body.block_id,
        choice_id: body.choice_id,
        label: body.label ?? null,
      },
    })
    return NextResponse.json({ ok: true })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

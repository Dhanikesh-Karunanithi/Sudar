import { createClient, createServiceRoleSupabaseClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { proactiveReplyBodySchema } from '@/lib/tutor/proactivePromptSchema'

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const parsed = proactiveReplyBodySchema.safeParse(await request.json().catch(() => ({})))
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid body' }, { status: 400 })
  }

  const { trigger, choice_id, choice_label, follow_up_message, course_id, module_id } = parsed.data
  const admin = createServiceRoleSupabaseClient()

  await admin.from('learning_events').insert({
    user_id: user.id,
    course_id: course_id ?? null,
    module_id: module_id ?? null,
    event_type: 'tutor_action_taken',
    modality: 'text',
    payload: {
      proactive: true,
      trigger,
      choice_id,
      choice_label: choice_label ?? null,
      has_follow_up: Boolean(follow_up_message?.trim()),
    },
  })

  await admin.from('ai_interactions').insert({
    user_id: user.id,
    course_id: course_id ?? null,
    module_id: module_id ?? null,
    interaction_type: 'proactive_choice',
    user_message: choice_id,
    ai_response: choice_label ?? choice_id,
    context_used: { trigger, follow_up_message: follow_up_message ?? null },
  })

  return NextResponse.json({ ok: true })
}

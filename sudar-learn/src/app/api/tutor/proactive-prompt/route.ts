import { createClient, createServiceRoleSupabaseClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { proactivePromptBodySchema } from '@/lib/tutor/proactivePromptSchema'
import { templateForRoute, templateSessionStart } from '@/lib/tutor/proactiveTemplates'

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const parsed = proactivePromptBodySchema.safeParse(await request.json().catch(() => ({})))
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid body' }, { status: 400 })
  }

  const { trigger, route } = parsed.data
  const admin = createServiceRoleSupabaseClient()

  const tpl =
    trigger === 'session_start'
      ? templateSessionStart()
      : templateForRoute(route ?? null, true)

  if (!tpl.show) {
    return NextResponse.json({ ok: true, skip: true as const })
  }

  await admin.from('ai_interactions').insert({
    user_id: user.id,
    course_id: null,
    module_id: null,
    interaction_type: 'proactive_nudge',
    user_message: `[${trigger}]`,
    ai_response: tpl.message,
    context_used: { trigger, route: route ?? null, choices: tpl.choices, template: true },
  })

  await admin.from('learning_events').insert({
    user_id: user.id,
    course_id: null,
    module_id: null,
    event_type: 'ai_tutor_open',
    modality: 'text',
    payload: { proactive: true, trigger, route: route ?? null },
  })

  return NextResponse.json({
    ok: true,
    message: tpl.message,
    choices: tpl.choices,
    trigger,
  })
}

import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceRoleSupabaseClient } from '@/lib/supabase/server'
import { earlyAccessFeedbackBodySchema } from '@shared-feedback/schemas'
import { canSubmitEarlyAccessFeedback } from '@shared-feedback/access'

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })

  const gate = await canSubmitEarlyAccessFeedback(supabase, user.id)
  if (!gate.allowed) {
    return NextResponse.json(
      { success: false, error: 'Early-access feedback is for invited testers only.' },
      { status: 403 },
    )
  }

  const body = await request.json().catch(() => ({}))
  const parsed = earlyAccessFeedbackBodySchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ success: false, error: parsed.error.flatten() }, { status: 400 })
  }

  const admin = createServiceRoleSupabaseClient()
  const { data, error } = await admin
    .from('early_access_feedback')
    .insert({
      user_id: user.id,
      org_id: gate.orgId,
      surface: parsed.data.surface,
      category: parsed.data.category,
      message: parsed.data.message,
      page_route: parsed.data.page_route ?? null,
      urls: parsed.data.urls,
      attachment_urls: parsed.data.attachment_urls,
      context: {
        ...parsed.data.context,
        access_tier: gate.accessTier,
        user_agent: request.headers.get('user-agent') ?? undefined,
      },
    })
    .select('id')
    .single()

  if (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true, feedback_id: data.id })
}

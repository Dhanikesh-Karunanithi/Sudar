import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient, createClient } from '@/lib/supabase/server'
import { z } from 'zod'

const bodySchema = z.object({
  action_type: z.string().min(1).max(80),
  target: z.record(z.unknown()).default({}),
  outcome: z.enum(['accepted', 'dismissed', 'later']),
  context: z.record(z.unknown()).default({}),
})

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })

  const payload = await request.json().catch(() => ({}))
  const parsed = bodySchema.safeParse(payload)
  if (!parsed.success) {
    return NextResponse.json({ success: false, error: 'Invalid request body' }, { status: 400 })
  }

  const admin = createAdminClient()
  const { error } = await admin.from('analytics_feedback').insert({
    user_id: user.id,
    action_type: parsed.data.action_type,
    target: parsed.data.target,
    outcome: parsed.data.outcome,
    context: parsed.data.context,
  })

  if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}

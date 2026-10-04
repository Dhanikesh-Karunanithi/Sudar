import { createClient, createServiceRoleSupabaseClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { buildClaimSchedulerCandidates, pickNextFifteenMinutes } from '@/lib/teaching/scheduler'

export async function GET() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })

  const admin = createServiceRoleSupabaseClient()
  const next = await pickNextFifteenMinutes(admin, user.id)
  const queue = await buildClaimSchedulerCandidates(admin, user.id, { limit: 8 })

  if (next) {
    await admin.from('learning_events').insert({
      user_id: user.id,
      event_type: 'review_due_served',
      modality: 'review',
      payload: { candidate: next },
    })
  }

  return NextResponse.json({ success: true, data: { next, queue } })
}

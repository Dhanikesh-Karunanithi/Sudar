import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

/**
 * Minimal right-to-access export (privacy / compliance scaffold).
 * Returns learner-scoped rows readable under RLS — expand as jurisdictions require.
 */
export async function GET() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized', code: 'UNAUTHORIZED' }, { status: 401 })
  }

  const [profileRes, enrollmentsRes, learningEventsRes, aiRes] = await Promise.all([
    supabase.from('profiles').select('id, full_name, role, org_id, created_at, updated_at').eq('id', user.id).maybeSingle(),
    supabase.from('enrollments').select('id, course_id, status, enrolled_at, completed_at').eq('user_id', user.id),
    supabase
      .from('learning_events')
      .select('id, course_id, module_id, event_type, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(5000),
    supabase
      .from('ai_interactions')
      .select('id, course_id, module_id, interaction_type, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(2000),
  ])

  return NextResponse.json({
    exported_at: new Date().toISOString(),
    user_id: user.id,
    profile: profileRes.data ?? null,
    enrollments: enrollmentsRes.data ?? [],
    learning_events: learningEventsRes.data ?? [],
    ai_interactions: aiRes.data ?? [],
    _note:
      'This export omits message bodies and tokens. Add org-specific fields and signed download links as required.',
  })
}

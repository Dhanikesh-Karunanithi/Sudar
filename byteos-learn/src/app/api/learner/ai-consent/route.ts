import { createClient, createAdminClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

/**
 * POST /api/learner/ai-consent — Record learner consent for generative personalization (org may require this).
 */
export async function POST() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const admin = createAdminClient()
  const now = new Date().toISOString()

  const { data: existing } = await admin
    .from('learner_profiles')
    .select('id')
    .eq('user_id', user.id)
    .single()

  if (!existing) {
    const { error: insErr } = await admin
      .from('learner_profiles')
      .insert({ user_id: user.id, generative_ai_consent_at: now })
    if (insErr) return NextResponse.json({ error: insErr.message }, { status: 500 })
  } else {
    const { error } = await admin
      .from('learner_profiles')
      .update({ generative_ai_consent_at: now, updated_at: now })
      .eq('user_id', user.id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  }

  await admin.from('learning_events').insert({
    user_id: user.id,
    event_type: 'ai_personalization_consent',
    payload: { granted_at: now },
  })

  return NextResponse.json({ ok: true, generative_ai_consent_at: now })
}

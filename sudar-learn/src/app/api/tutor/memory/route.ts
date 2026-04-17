import { createClient, createAdminClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

// User-controlled fields — these are safe to edit directly
const USER_EDITABLE_KEYS = [
  'self_reported_background',
  'learning_goals',
  'preferred_explanation_style',
  'preferred_response_length',
  'modality_preference',
  'learning_frequency',
  'difficulty_comfort',
  'onboarding_complete',
]

export async function PATCH(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const admin = createAdminClient()
  const body = await request.json()

  // Only allow user-editable fields
  const safeUpdates: Record<string, string> = {}
  for (const key of USER_EDITABLE_KEYS) {
    if (key in body) safeUpdates[key] = String(body[key]).slice(0, 1000) // cap length
  }

  if (Object.keys(safeUpdates).length === 0) {
    return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 })
  }

  // Merge into existing ai_tutor_context
  const { data: profile } = await admin
    .from('learner_profiles')
    .select('ai_tutor_context')
    .eq('user_id', user.id)
    .single()

  const existing = (profile?.ai_tutor_context as Record<string, unknown>) ?? {}
  const updated = { ...existing, ...safeUpdates, last_updated: new Date().toISOString() }

  const { error } = await admin
    .from('learner_profiles')
    .update({ ai_tutor_context: updated })
    .eq('user_id', user.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const admin = createAdminClient()
  const { data: profile } = await admin
    .from('learner_profiles')
    .select('ai_tutor_context')
    .eq('user_id', user.id)
    .single()

  const memory = (profile?.ai_tutor_context as Record<string, unknown>) ?? {}
  return NextResponse.json({ memory })
}

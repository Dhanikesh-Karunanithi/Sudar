/**
 * GET /api/checkin/next
 * Returns the next unanswered check-in question for the current user.
 * Excludes org-only questions for non-org users. Max 3/day.
 */

import { createClient, createServiceRoleSupabaseClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const admin = createServiceRoleSupabaseClient()

  // Check if user has org (for org-only questions)
  const { data: profile } = await admin
    .from('profiles')
    .select('org_id')
    .eq('id', user.id)
    .single()

  const hasOrg = !!profile?.org_id

  // Check daily limit (3 check-ins per day)
  const todayStart = new Date()
  todayStart.setHours(0, 0, 0, 0)
  const { count: todayCount } = await admin
    .from('checkin_responses')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .gte('created_at', todayStart.toISOString())

  if ((todayCount ?? 0) >= 3) {
    return NextResponse.json({ success: true, data: null, reason: 'daily_limit_reached' })
  }

  // Get already answered question IDs
  const { data: answered } = await admin
    .from('checkin_responses')
    .select('question_id')
    .eq('user_id', user.id)

  const answeredIds = (answered ?? []).map((r) => r.question_id)

  // Build question query
  let query = admin
    .from('checkin_questions')
    .select('id, question_text, answer_type, options, signal_key, category')
    .order('weight', { ascending: false })

  if (!hasOrg) {
    query = query.eq('is_org_only', false)
  }

  if (answeredIds.length > 0) {
    query = query.not('id', 'in', `(${answeredIds.map((id) => `'${id}'`).join(',')})`)
  }

  const { data: questions } = await query.limit(10)

  if (!questions || questions.length === 0) {
    return NextResponse.json({ success: true, data: null, reason: 'all_answered' })
  }

  // Pick a random question from the top 10 (adds variety)
  const randomIndex = Math.floor(Math.random() * Math.min(questions.length, 5))
  const question = questions[randomIndex]

  return NextResponse.json({ success: true, data: question })
}

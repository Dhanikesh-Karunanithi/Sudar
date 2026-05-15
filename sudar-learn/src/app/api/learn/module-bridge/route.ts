import { createClient, createServiceRoleSupabaseClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { fetchResolvedLearnerPreferences } from '@/lib/learner/learnerPreferences'
import { moduleBridgeQuerySchema } from '@/lib/learn/moduleBridgeQuery'

/**
 * Lightweight "connect prior module → current module" prompt (no blocking; learner can dismiss).
 */
export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const parsed = moduleBridgeQuerySchema.safeParse({
    course_id: request.nextUrl.searchParams.get('course_id'),
    module_id: request.nextUrl.searchParams.get('module_id'),
  })
  if (!parsed.success) {
    return NextResponse.json({ error: 'course_id and module_id must be valid UUIDs' }, { status: 400 })
  }
  const { course_id: courseId, module_id: moduleId } = parsed.data

  const admin = createServiceRoleSupabaseClient()

  const { data: enrollment } = await admin
    .from('enrollments')
    .select('id')
    .eq('user_id', user.id)
    .eq('course_id', courseId)
    .maybeSingle()
  if (!enrollment) {
    return NextResponse.json({ show: false, reason: 'no_previous_module' })
  }

  const prefs = await fetchResolvedLearnerPreferences(admin, user.id)
  if (!prefs.module_bridge_prompts) {
    return NextResponse.json({ show: false, reason: 'disabled' })
  }

  const { data: course, error: courseErr } = await admin
    .from('courses')
    .select('id, title, modules(id, title, order_index)')
    .eq('id', courseId)
    .eq('status', 'published')
    .maybeSingle()
  if (courseErr || !course) {
    return NextResponse.json({ show: false, reason: 'no_previous_module' })
  }

  const modules = (course.modules as Array<{ id: string; title: string; order_index: number }>) ?? []
  const ordered = [...modules].sort((a, b) => (a.order_index ?? 0) - (b.order_index ?? 0))
  const idx = ordered.findIndex((m) => m.id === moduleId)
  const prev = idx > 0 ? ordered[idx - 1] : null
  const current = ordered[idx]

  if (!prev || !current) {
    return NextResponse.json({ show: false, reason: 'no_previous_module' })
  }

  const { data: profile } = await admin
    .from('learner_profiles')
    .select('ai_tutor_context')
    .eq('user_id', user.id)
    .maybeSingle()

  const mem = (profile?.ai_tutor_context as Record<string, unknown>) ?? {}
  const goals = String(mem.learning_goals ?? '').trim()

  const body = goals
    ? `You opened **${current.title}**. It builds on **${prev.title}**. Your goal: ${goals.slice(0, 200)}${goals.length > 200 ? '…' : ''} — ask Sudar how today’s module connects.`
    : `You’re moving from **${prev.title}** to **${current.title}**. Want a one-line link between them before you dive in? Ask Sudar in chat.`

  return NextResponse.json({
    show: true,
    prev_module_id: prev.id,
    prev_module_title: prev.title,
    current_module_title: current.title,
    body,
  })
}

import { createClient, createServiceRoleSupabaseClient } from '@/lib/supabase/server'
import { dispatchUserNotification } from '@/lib/notifications/dispatch'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const admin = createServiceRoleSupabaseClient()
  const { course_id } = await request.json()
  if (!course_id) return NextResponse.json({ error: 'course_id required' }, { status: 400 })

  const { data: course } = await admin
    .from('courses')
    .select('id, title')
    .eq('id', course_id)
    .eq('status', 'published')
    .single()

  if (!course) return NextResponse.json({ error: 'Course not found or not published' }, { status: 404 })

  // Check if already enrolled — return existing
  const { data: existing } = await admin
    .from('enrollments')
    .select('id, status, progress_pct, personalized_welcome')
    .eq('user_id', user.id)
    .eq('course_id', course_id)
    .single()

  if (existing) return NextResponse.json(existing)

  // Create enrollment
  const { data, error } = await admin
    .from('enrollments')
    .insert({
      user_id: user.id,
      course_id,
      status: 'not_started',
      progress_pct: 0,
      enrolled_by: user.id,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  await admin.from('learning_events').insert({
    user_id: user.id,
    course_id,
    event_type: 'course_enroll',
    payload: { course_title: course.title },
  })

  await dispatchUserNotification({
    userId: user.id,
    category: 'course_assigned',
    title: `Enrolled: ${course.title}`,
    body: 'Open the course to start learning.',
    linkUrl: `/courses/${course_id}/learn`,
    metadata: { course_id },
  })

  // Ensure learner_profile exists
  const { data: existingProfile } = await admin
    .from('learner_profiles')
    .select('id')
    .eq('user_id', user.id)
    .single()

  if (!existingProfile) {
    await admin.from('learner_profiles').insert({ user_id: user.id })
  }

  // Personalized course welcome is opt-in from the course viewer ("Personalize for me")
  // — see POST /api/ai/enroll-bridge — to avoid silent AI calls and respect learner choice.

  return NextResponse.json(data, { status: 201 })
}

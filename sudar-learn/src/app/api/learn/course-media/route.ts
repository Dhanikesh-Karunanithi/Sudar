import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceRoleSupabaseClient } from '@/lib/supabase/server'

/** Lazy-load course-level video/podcast media (includes audioDataURL blobs). */
export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const courseId = request.nextUrl.searchParams.get('course_id')
  if (!courseId) {
    return NextResponse.json({ error: 'course_id required' }, { status: 400 })
  }

  const admin = createServiceRoleSupabaseClient()

  const { data: enrollment } = await admin
    .from('enrollments')
    .select('id')
    .eq('user_id', user.id)
    .eq('course_id', courseId)
    .maybeSingle()
  if (!enrollment) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { data: course, error } = await admin
    .from('courses')
    .select('settings')
    .eq('id', courseId)
    .eq('status', 'published')
    .maybeSingle()

  if (error || !course) {
    return NextResponse.json({ error: 'Course not found' }, { status: 404 })
  }

  const settings = (course.settings as Record<string, unknown> | null) ?? {}
  return NextResponse.json({
    video_scenes: settings.video_scenes ?? null,
    podcast_dialogue: settings.podcast_dialogue ?? null,
  })
}

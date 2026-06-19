import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceRoleSupabaseClient } from '@/lib/supabase/server'

/** Lazy-load full module content (avoids shipping every module in SSR on Cloudflare Workers). */
export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const courseId = request.nextUrl.searchParams.get('course_id')
  const moduleId = request.nextUrl.searchParams.get('module_id')
  if (!courseId || !moduleId) {
    return NextResponse.json({ error: 'course_id and module_id required' }, { status: 400 })
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

  const { data: moduleRow, error } = await admin
    .from('modules')
    .select('id, content, quiz')
    .eq('id', moduleId)
    .eq('course_id', courseId)
    .maybeSingle()

  if (error || !moduleRow) {
    return NextResponse.json({ error: 'Module not found' }, { status: 404 })
  }

  return NextResponse.json({
    id: moduleRow.id,
    content: moduleRow.content,
    quiz: moduleRow.quiz,
  })
}

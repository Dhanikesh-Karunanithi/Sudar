import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceRoleSupabaseClient } from '@/lib/supabase/server'
import { moduleContentToPlainText } from '@/lib/learn/modulePlainText'

/** Plain-text module bodies for course-scope mindmap (without full SSR payload). */
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

  const { data: rows, error } = await admin
    .from('modules')
    .select('title, content, order_index')
    .eq('course_id', courseId)
    .order('order_index', { ascending: true })

  if (error) {
    return NextResponse.json({ error: 'Failed to load modules' }, { status: 500 })
  }

  const modules = (rows ?? [])
    .map((row) => ({
      title: row.title as string,
      content: moduleContentToPlainText(row.content),
    }))
    .filter((m) => m.content.trim().length > 0)

  return NextResponse.json({ modules })
}

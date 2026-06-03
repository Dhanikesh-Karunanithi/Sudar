import { createClient, createServiceRoleSupabaseClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { resolveChatConfigError } from '@/lib/ai/chat'
import { fetchStudioOrgAiContext, studioMeteringChatCtx } from '@/lib/ai/studioOrgAiChat'
import { withUsageMetadata } from '@/lib/ai/studioUsageContext'
import { fillEmptyModulesForCourse } from '@/lib/ai/courseGeneration'

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { course_id } = await request.json()
  if (!course_id) return NextResponse.json({ error: 'course_id required' }, { status: 400 })

  const admin = createServiceRoleSupabaseClient()

  const { data: course, error: courseErr } = await admin
    .from('courses')
    .select('id, title, description, difficulty, created_by, org_id, settings')
    .eq('id', course_id)
    .single()

  if (courseErr || !course) return NextResponse.json({ error: 'Course not found' }, { status: 404 })
  if (course.created_by !== user.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { orgSettings, privateRuntime } = await fetchStudioOrgAiContext(admin, course.org_id)
  const configError = resolveChatConfigError(orgSettings, privateRuntime)
  if (configError) return NextResponse.json({ error: configError }, { status: 500 })
  const chatAiCtx = withUsageMetadata(
    studioMeteringChatCtx(
      admin,
      course.org_id,
      user.id,
      orgSettings,
      privateRuntime,
      'course_generation',
      '/api/ai/generate-all-modules'
    ),
    { course_id: course.id }
  )

  const { data: modules } = await admin
    .from('modules')
    .select('id, title, content, order_index')
    .eq('course_id', course_id)
    .order('order_index', { ascending: true })

  const result = await fillEmptyModulesForCourse(admin, {
    course: {
      id: course.id,
      title: course.title,
      description: course.description,
      difficulty: course.difficulty,
      settings: course.settings as Record<string, unknown> | null,
    },
    modules: modules ?? [],
    chatAiCtx,
  })

  if (result.error) {
    return NextResponse.json(
      {
        error: result.error,
        modules_generated: result.modules_generated,
      },
      { status: 502 }
    )
  }

  return NextResponse.json({ completed: result.completed, modules_generated: result.modules_generated })
}

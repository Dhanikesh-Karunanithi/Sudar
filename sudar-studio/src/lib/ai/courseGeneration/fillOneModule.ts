import { createServiceRoleSupabaseClient } from '@/lib/supabase/server'
import { resolveChatConfigError } from '@/lib/ai/chat'
import { fetchStudioOrgAiContext, studioMeteringChatCtx } from '@/lib/ai/studioOrgAiChat'
import { withUsageMetadata } from '@/lib/ai/studioUsageContext'
import {
  fillEmptyModulesForCourse,
  isWorkerInvocationLimitError,
  MODULES_PER_WORKER_INVOCATION,
} from '@/lib/ai/courseGeneration'

export type FillOnePayload = {
  course_id: string
  completed: boolean
  needs_continue: boolean
  modules_generated: number
  remaining_empty: number
  warning?: string
  error?: string
}

export async function fillOneEmptyModule(
  courseId: string,
  actorUserId: string
): Promise<{ status: number; payload: FillOnePayload }> {
  const admin = createServiceRoleSupabaseClient()

  const { data: course, error: courseErr } = await admin
    .from('courses')
    .select('id, title, description, difficulty, created_by, org_id, settings')
    .eq('id', courseId)
    .single()

  if (courseErr || !course) {
    return { status: 404, payload: emptyFail(courseId, 'Course not found') }
  }
  if (course.created_by !== actorUserId) {
    return { status: 403, payload: emptyFail(courseId, 'Forbidden') }
  }

  const { orgSettings, privateRuntime } = await fetchStudioOrgAiContext(admin, course.org_id)
  const configError = resolveChatConfigError(orgSettings, privateRuntime)
  if (configError) {
    return { status: 500, payload: emptyFail(course.id, configError) }
  }
  const chatAiCtx = withUsageMetadata(
    studioMeteringChatCtx(
      admin,
      course.org_id,
      actorUserId,
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
    .eq('course_id', courseId)
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
    maxModules: MODULES_PER_WORKER_INVOCATION,
  })

  const retryableLimit = Boolean(result.error) && isWorkerInvocationLimitError(result.error ?? '')
  const payload: FillOnePayload = {
    course_id: course.id,
    completed: result.completed,
    needs_continue: !result.completed,
    modules_generated: result.modules_generated,
    remaining_empty: result.remaining_empty ?? 0,
    ...(result.error ? { warning: result.error } : {}),
    ...(result.error && !retryableLimit ? { error: result.error } : {}),
  }

  return { status: result.error && !retryableLimit ? 502 : 200, payload }
}

function emptyFail(courseId: string, error: string): FillOnePayload {
  return {
    course_id: courseId,
    completed: false,
    needs_continue: false,
    modules_generated: 0,
    remaining_empty: 0,
    error,
  }
}

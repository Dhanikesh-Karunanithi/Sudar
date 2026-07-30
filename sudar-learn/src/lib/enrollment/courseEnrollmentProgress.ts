import type { createServiceRoleSupabaseClient } from '@/lib/supabase/server'

type AdminClient = ReturnType<typeof createServiceRoleSupabaseClient>

export interface CourseEnrollmentProgress {
  progress: number
  status: 'in_progress' | 'completed'
  totalModules: number
  completedModules: number
}

/** Progress from distinct completed module_ids — duplicate events must not inflate completion. */
export async function computeCourseEnrollmentProgress(
  admin: AdminClient,
  userId: string,
  courseId: string,
): Promise<CourseEnrollmentProgress | null> {
  const { count: totalModules } = await admin
    .from('modules')
    .select('id', { count: 'exact', head: true })
    .eq('course_id', courseId)

  if (!totalModules) return null

  const { data: completedEvents } = await admin
    .from('learning_events')
    .select('module_id')
    .eq('user_id', userId)
    .eq('course_id', courseId)
    .eq('event_type', 'module_complete')
    .not('module_id', 'is', null)

  const distinctModuleIds = new Set(
    (completedEvents ?? []).map((event) => event.module_id).filter((id): id is string => Boolean(id)),
  )
  const completedModules = distinctModuleIds.size
  const progress = Math.min(100, Math.round((completedModules / totalModules) * 100))
  const status = progress >= 100 ? 'completed' : 'in_progress'

  return { progress, status, totalModules, completedModules }
}

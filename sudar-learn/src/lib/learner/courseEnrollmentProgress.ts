import type { createServiceRoleSupabaseClient } from '@/lib/supabase/server'

type AdminClient = ReturnType<typeof createServiceRoleSupabaseClient>

export interface CourseProgressSnapshot {
  totalModules: number
  completedModules: number
  progressPct: number
  status: 'not_started' | 'in_progress' | 'completed'
}

/** Count distinct modules with at least one module_complete event (not raw event rows). */
export async function countDistinctCompletedModules(
  admin: AdminClient,
  userId: string,
  courseId: string
): Promise<number> {
  const { data } = await admin
    .from('learning_events')
    .select('module_id')
    .eq('user_id', userId)
    .eq('course_id', courseId)
    .eq('event_type', 'module_complete')
    .not('module_id', 'is', null)

  const distinct = new Set((data ?? []).map((row) => row.module_id).filter(Boolean))
  return distinct.size
}

export function computeCourseProgressSnapshot(
  totalModules: number,
  completedModules: number
): CourseProgressSnapshot {
  if (totalModules <= 0) {
    return { totalModules: 0, completedModules: 0, progressPct: 0, status: 'not_started' }
  }

  const progressPct = Math.min(100, Math.round((completedModules / totalModules) * 100))
  const status = progressPct >= 100 ? 'completed' : completedModules > 0 ? 'in_progress' : 'not_started'

  return { totalModules, completedModules, progressPct, status }
}

export async function resolveCourseProgressSnapshot(
  admin: AdminClient,
  userId: string,
  courseId: string
): Promise<CourseProgressSnapshot> {
  const { count: totalModules } = await admin
    .from('modules')
    .select('id', { count: 'exact', head: true })
    .eq('course_id', courseId)

  const completedModules = await countDistinctCompletedModules(admin, userId, courseId)
  return computeCourseProgressSnapshot(totalModules ?? 0, completedModules)
}

import type { SupabaseClient } from '@supabase/supabase-js'

/** Count unique modules completed — duplicate events for the same module must not inflate progress. */
export function countDistinctModuleCompletes(
  rows: Array<{ module_id: string | null }>,
): number {
  const moduleIds = new Set<string>()
  for (const row of rows) {
    if (row.module_id) moduleIds.add(row.module_id)
  }
  return moduleIds.size
}

export function computeCourseProgressPct(
  completedModules: number,
  totalModules: number,
): { progress: number; status: 'completed' | 'in_progress' } {
  if (totalModules <= 0) {
    return { progress: 0, status: 'in_progress' }
  }
  const progress = Math.min(100, Math.round((completedModules / totalModules) * 100))
  return { progress, status: progress >= 100 ? 'completed' : 'in_progress' }
}

/**
 * Recompute course enrollment progress from distinct module_complete events,
 * then sync any path enrollments that include this course.
 */
export async function syncCourseEnrollmentProgress(
  admin: SupabaseClient,
  userId: string,
  courseId: string,
): Promise<void> {
  const { data: courseEnrollment } = await admin
    .from('enrollments')
    .select('id')
    .eq('user_id', userId)
    .eq('course_id', courseId)
    .maybeSingle()

  if (!courseEnrollment) return

  const { count: totalModules } = await admin
    .from('modules')
    .select('id', { count: 'exact', head: true })
    .eq('course_id', courseId)

  if (!totalModules || totalModules <= 0) return

  const { data: completedRows } = await admin
    .from('learning_events')
    .select('module_id')
    .eq('user_id', userId)
    .eq('course_id', courseId)
    .eq('event_type', 'module_complete')

  const completedModules = countDistinctModuleCompletes(completedRows ?? [])
  const { progress, status } = computeCourseProgressPct(completedModules, totalModules)

  await admin
    .from('enrollments')
    .update({
      progress_pct: progress,
      status,
      ...(status === 'in_progress' && { started_at: new Date().toISOString() }),
      ...(status === 'completed' && { completed_at: new Date().toISOString() }),
    })
    .eq('user_id', userId)
    .eq('course_id', courseId)

  const { data: pathEnrollmentsForSync } = await admin
    .from('enrollments')
    .select('id, path_id, personalized_sequence')
    .eq('user_id', userId)
    .not('path_id', 'is', null)

  for (const pe of pathEnrollmentsForSync ?? []) {
    const seq = (pe.personalized_sequence as Array<{ course_id: string }>) ?? []
    const courseIdsInPath = seq.map((c) => c.course_id).filter(Boolean)
    if (!courseIdsInPath.includes(courseId)) continue

    const { data: courseStatuses } = await admin
      .from('enrollments')
      .select('course_id, status')
      .eq('user_id', userId)
      .in('course_id', courseIdsInPath)

    const totalInPath = courseIdsInPath.length
    const completedInPath = (courseStatuses ?? []).filter((e) => e.status === 'completed').length
    const pathProgressPct = totalInPath ? Math.round((completedInPath / totalInPath) * 100) : 0

    await admin
      .from('enrollments')
      .update({ progress_pct: pathProgressPct })
      .eq('id', pe.id)
  }
}

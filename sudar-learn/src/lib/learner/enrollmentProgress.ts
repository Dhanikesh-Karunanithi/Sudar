import type { createServiceRoleSupabaseClient } from '@/lib/supabase/server'

type Admin = ReturnType<typeof createServiceRoleSupabaseClient>

export function countDistinctCompletedModules(
  rows: Array<{ module_id: string | null }>,
): number {
  const moduleIds = rows
    .map((row) => row.module_id)
    .filter((id): id is string => typeof id === 'string' && id.length > 0)
  return new Set(moduleIds).size
}

export function computeEnrollmentProgress(
  completedDistinct: number,
  totalModules: number,
): { progress_pct: number; status: 'completed' | 'in_progress' } {
  if (totalModules <= 0) {
    return { progress_pct: 0, status: 'in_progress' }
  }
  const progress = Math.min(100, Math.round((completedDistinct / totalModules) * 100))
  return {
    progress_pct: progress,
    status: progress >= 100 ? 'completed' : 'in_progress',
  }
}

export async function syncEnrollmentProgressAfterModuleComplete(
  admin: Admin,
  userId: string,
  courseId: string,
): Promise<void> {
  const { count: totalModules } = await admin
    .from('modules')
    .select('id', { count: 'exact', head: true })
    .eq('course_id', courseId)

  const { data: completedRows } = await admin
    .from('learning_events')
    .select('module_id')
    .eq('user_id', userId)
    .eq('course_id', courseId)
    .eq('event_type', 'module_complete')
    .not('module_id', 'is', null)

  if (!totalModules || totalModules <= 0) return

  const completedDistinct = countDistinctCompletedModules(completedRows ?? [])
  const { progress_pct, status } = computeEnrollmentProgress(completedDistinct, totalModules)

  await admin
    .from('enrollments')
    .update({
      progress_pct,
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

import type { createServiceRoleSupabaseClient } from '@/lib/supabase/server'

type AdminClient = ReturnType<typeof createServiceRoleSupabaseClient>

/** Distinct modules with at least one module_complete event (revisits must not inflate progress). */
export async function countDistinctModulesCompleted(
  admin: AdminClient,
  userId: string,
  courseId: string,
): Promise<number> {
  const { data: rows, error } = await admin
    .from('learning_events')
    .select('module_id')
    .eq('user_id', userId)
    .eq('course_id', courseId)
    .eq('event_type', 'module_complete')
    .not('module_id', 'is', null)

  if (error || !rows?.length) return 0

  const ids = rows
    .map((r) => r.module_id)
    .filter((id): id is string => typeof id === 'string' && id.length > 0)
  return new Set(ids).size
}

export function computeEnrollmentProgressPercent(
  distinctCompletedModules: number,
  totalModules: number,
): { progressPct: number; status: 'in_progress' | 'completed' } {
  if (totalModules <= 0) {
    return { progressPct: 0, status: 'in_progress' }
  }
  const progressPct = Math.min(100, Math.round((distinctCompletedModules / totalModules) * 100))
  const status = progressPct >= 100 ? 'completed' : 'in_progress'
  return { progressPct, status }
}

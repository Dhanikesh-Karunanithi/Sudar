import type { SupabaseClient } from '@supabase/supabase-js'

type PathSequenceEntry = { course_id: string; is_mandatory?: boolean }

/** Distinct modules with at least one module_complete event (duplicate events must not inflate progress). */
export async function countDistinctCompletedModules(
  admin: SupabaseClient,
  userId: string,
  courseId: string,
): Promise<number> {
  const { data } = await admin
    .from('learning_events')
    .select('module_id')
    .eq('user_id', userId)
    .eq('course_id', courseId)
    .eq('event_type', 'module_complete')
    .not('module_id', 'is', null)

  const ids = (data ?? [])
    .map((row) => row.module_id)
    .filter((id): id is string => typeof id === 'string' && id.length > 0)
  return new Set(ids).size
}

/** True when every mandatory course in the path enrollment sequence is completed. */
export async function pathMandatoryCoursesCompleted(
  admin: SupabaseClient,
  userId: string,
  personalizedSequence: unknown,
): Promise<boolean> {
  const seq = (Array.isArray(personalizedSequence) ? personalizedSequence : []) as PathSequenceEntry[]
  const mandatoryCourseIds = seq.filter((c) => c.is_mandatory).map((c) => c.course_id).filter(Boolean)
  if (mandatoryCourseIds.length === 0) return false

  const { data: statuses } = await admin
    .from('enrollments')
    .select('course_id, status')
    .eq('user_id', userId)
    .in('course_id', mandatoryCourseIds)

  return mandatoryCourseIds.every(
    (cid) => statuses?.find((e) => e.course_id === cid)?.status === 'completed',
  )
}

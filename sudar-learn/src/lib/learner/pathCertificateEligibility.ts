import type { createServiceRoleSupabaseClient } from '@/lib/supabase/server'

type AdminClient = ReturnType<typeof createServiceRoleSupabaseClient>

export async function isLearnerEligibleForPathCertificate(
  admin: AdminClient,
  userId: string,
  pathId: string,
): Promise<{ eligible: boolean; reason?: string }> {
  const { data: pathEnrollment } = await admin
    .from('enrollments')
    .select('id, personalized_sequence, status')
    .eq('user_id', userId)
    .eq('path_id', pathId)
    .maybeSingle()

  if (!pathEnrollment) {
    return { eligible: false, reason: 'Not enrolled in this learning path' }
  }

  const seq = (pathEnrollment.personalized_sequence as Array<{ course_id: string; is_mandatory?: boolean }>) ?? []
  const mandatoryCourseIds = seq.filter((c) => c.is_mandatory).map((c) => c.course_id).filter(Boolean)

  if (mandatoryCourseIds.length === 0) {
    return { eligible: false, reason: 'Path has no mandatory courses' }
  }

  const { data: mandatoryStatuses } = await admin
    .from('enrollments')
    .select('course_id, status')
    .eq('user_id', userId)
    .in('course_id', mandatoryCourseIds)

  const allMandatoryDone = mandatoryCourseIds.every(
    (courseId) => mandatoryStatuses?.find((row) => row.course_id === courseId)?.status === 'completed',
  )

  if (!allMandatoryDone) {
    return { eligible: false, reason: 'Mandatory path courses are not all completed' }
  }

  return { eligible: true }
}

import type { createServiceRoleSupabaseClient } from '@/lib/supabase/server'

type AdminClient = ReturnType<typeof createServiceRoleSupabaseClient>

interface PathCourseRef {
  course_id: string
  is_mandatory?: boolean
}

export interface PathCertificateEligibility {
  eligible: boolean
  reason?: 'not_enrolled' | 'no_courses' | 'incomplete'
}

/** Learner must be path-enrolled and have all mandatory path courses completed. */
export async function checkPathCertificateEligibility(
  admin: AdminClient,
  userId: string,
  pathId: string,
): Promise<PathCertificateEligibility> {
  const { data: pathEnrollment } = await admin
    .from('enrollments')
    .select('id, personalized_sequence')
    .eq('user_id', userId)
    .eq('path_id', pathId)
    .maybeSingle()

  if (!pathEnrollment) return { eligible: false, reason: 'not_enrolled' }

  const sequence = (pathEnrollment.personalized_sequence as PathCourseRef[] | null) ?? []
  const mandatoryCourseIds = sequence.filter((course) => course.is_mandatory).map((course) => course.course_id)
  const courseIdsToCheck =
    mandatoryCourseIds.length > 0 ? mandatoryCourseIds : sequence.map((course) => course.course_id).filter(Boolean)

  if (courseIdsToCheck.length === 0) return { eligible: false, reason: 'no_courses' }

  const { data: courseStatuses } = await admin
    .from('enrollments')
    .select('course_id, status')
    .eq('user_id', userId)
    .in('course_id', courseIdsToCheck)

  const allDone = courseIdsToCheck.every(
    (courseId) => courseStatuses?.find((enrollment) => enrollment.course_id === courseId)?.status === 'completed',
  )

  if (!allDone) return { eligible: false, reason: 'incomplete' }
  return { eligible: true }
}

type EnrollmentRow = { id: string } | null
type CourseRow = { org_id: string | null } | null
type MemberRow = { id: string } | null

type QueryBuilder = {
  select: (columns: string) => QueryBuilder
  eq: (column: string, value: string) => QueryBuilder
  maybeSingle: () => Promise<{ data: unknown }>
}

type SupabaseLikeClient = {
  from: (table: string) => QueryBuilder
}

export function normalizeStoragePath(segments: string[]): string | null {
  const path = segments.join('/').replace(/\\/g, '/').replace(/\/+/g, '/').replace(/^\/+/, '')
  if (!path || path.includes('..')) return null
  return path
}

export function courseIdFromScormPath(path: string): string | null {
  const match = path.match(/^scorm-packages\/([^/]+)\//)
  return match?.[1] ?? null
}

/**
 * Learner may load SCORM assets when enrolled in the course, or when they are
 * a member of the course's organisation (admins reviewing without a fresh enroll).
 */
export async function canLearnerAccessScormPath(
  adminClient: unknown,
  userId: string,
  storagePath: string,
): Promise<boolean> {
  const courseId = courseIdFromScormPath(storagePath)
  if (!courseId) return false
  const admin = adminClient as SupabaseLikeClient

  const { data: enrollment } = (await admin
    .from('enrollments')
    .select('id')
    .eq('user_id', userId)
    .eq('course_id', courseId)
    .maybeSingle()) as { data: EnrollmentRow }

  if (enrollment?.id) return true

  const { data: course } = (await admin
    .from('courses')
    .select('org_id')
    .eq('id', courseId)
    .maybeSingle()) as { data: CourseRow }

  const orgId = course?.org_id
  if (!orgId) return false

  const { data: member } = (await admin
    .from('org_members')
    .select('id')
    .eq('org_id', orgId)
    .eq('user_id', userId)
    .maybeSingle()) as { data: MemberRow }

  return Boolean(member?.id)
}

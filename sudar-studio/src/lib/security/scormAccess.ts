type SupabaseLikeClient = {
  from: (table: string) => {
    select: (columns: string) => SupabaseLikeQuery
  }
}

type SupabaseLikeQuery = {
  eq: (column: string, value: string) => SupabaseLikeQuery
  maybeSingle: () => Promise<{ data: unknown }>
}

type CourseRow = {
  id: string
  org_id: string | null
  created_by: string | null
}

type MembershipRow = {
  role: string | null
}

const CONTENT_EDITOR_ROLES = new Set(['admin', 'manager', 'creator', 'ADMIN', 'MANAGER', 'CREATOR'])

export function normalizeStoragePath(segments: string[]): string | null {
  const path = segments.join('/').replace(/\\/g, '/').replace(/\/+/g, '/').replace(/^\/+/, '')
  if (!path || path.includes('..')) return null
  return path
}

export function courseIdFromScormPath(path: string): string | null {
  const match = path.match(/^scorm-packages\/([^/]+)\//)
  return match?.[1] ?? null
}

export async function canStudioUserAccessScormPath(
  adminClient: unknown,
  userId: string,
  storagePath: string,
): Promise<boolean> {
  const courseId = courseIdFromScormPath(storagePath)
  if (!courseId) return false
  const admin = adminClient as SupabaseLikeClient

  const { data: courseData } = await admin
    .from('courses')
    .select('id, org_id, created_by')
    .eq('id', courseId)
    .maybeSingle()

  const course = courseData as CourseRow | null
  if (!course) return false
  if (course.created_by === userId) return true
  if (!course.org_id) return false

  const { data: membershipData } = await admin
    .from('org_members')
    .select('role')
    .eq('org_id', course.org_id)
    .eq('user_id', userId)
    .maybeSingle()

  const membership = membershipData as MembershipRow | null
  return !!membership?.role && CONTENT_EDITOR_ROLES.has(membership.role)
}

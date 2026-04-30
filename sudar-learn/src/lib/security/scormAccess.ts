type SupabaseLikeClient = {
  from: (table: string) => {
    select: (columns: string) => SupabaseLikeQuery
  }
}

type SupabaseLikeQuery = {
  eq: (column: string, value: string) => SupabaseLikeQuery
  maybeSingle: () => Promise<{ data: unknown }>
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

export async function canLearnerAccessScormPath(
  adminClient: unknown,
  userId: string,
  storagePath: string,
): Promise<boolean> {
  const courseId = courseIdFromScormPath(storagePath)
  if (!courseId) return false
  const admin = adminClient as SupabaseLikeClient

  const { data } = await admin
    .from('enrollments')
    .select('id')
    .eq('user_id', userId)
    .eq('course_id', courseId)
    .maybeSingle()
  return !!data
}

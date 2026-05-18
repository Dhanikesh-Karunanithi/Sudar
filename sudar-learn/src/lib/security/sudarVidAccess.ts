type SupabaseLikeClient = {
  from: (table: string) => {
    select: (columns: string, options?: { count?: 'exact'; head?: boolean }) => SupabaseLikeQuery
  }
}

type SupabaseLikeQuery = {
  eq: (column: string, value: string) => SupabaseLikeQuery
  contains: (column: string, value: Record<string, unknown>) => SupabaseLikeQuery
  maybeSingle: () => Promise<{ data: unknown }>
}

export function isSafeSudarVidJobId(jobId: string): boolean {
  return /^[a-zA-Z0-9_-]{8,128}$/.test(jobId)
}

export function normalizeRenderAssetPath(segments: string[]): string | null {
  const path = segments.join('/').replace(/\\/g, '/').replace(/\/+/g, '/').replace(/^\/+/, '')
  if (!path || path.includes('..')) return null
  return path
}

export async function canUserAccessSudarVidJob(
  adminClient: unknown,
  userId: string,
  jobId: string,
): Promise<boolean> {
  if (!isSafeSudarVidJobId(jobId)) return false
  const admin = adminClient as SupabaseLikeClient

  const { data } = await admin
    .from('learning_events')
    .select('id')
    .eq('user_id', userId)
    .eq('event_type', 'video_generate_start')
    .contains('payload', { job_id: jobId })
    .limit(1)

  return Array.isArray(data) && data.length > 0
}

export async function canUserAccessCourseModule(
  adminClient: unknown,
  userId: string,
  courseId: string,
  moduleId: string,
): Promise<boolean> {
  const admin = adminClient as SupabaseLikeClient
  const [{ data: enrollment }, { data: module }] = await Promise.all([
    admin
      .from('enrollments')
      .select('id')
      .eq('user_id', userId)
      .eq('course_id', courseId)
      .maybeSingle(),
    admin
      .from('modules')
      .select('id')
      .eq('id', moduleId)
      .eq('course_id', courseId)
      .maybeSingle(),
  ])

  return !!enrollment && !!module
}

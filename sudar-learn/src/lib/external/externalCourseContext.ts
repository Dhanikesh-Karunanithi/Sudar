import type { SupabaseClient } from '@supabase/supabase-js'
import type { ExternalCourseEngagementEntry, ExternalCourseEngagementMap } from '../../../../shared/external-courses/types'

export async function loadExternalCourseContext(
  admin: SupabaseClient,
  courseId: string,
): Promise<string> {
  // allow_tutor_discussion may be absent until migration 20260602120000 is applied.
  const { data: course } = await admin
    .from('courses')
    .select(
      'title, description, external_provider, external_url, content_access_mode, external_metadata',
    )
    .eq('id', courseId)
    .eq('is_external', true)
    .maybeSingle()

  if (!course) return ''

  if (course.content_access_mode === 'iframe_only') {
    return `[External course "${course.title}" on ${course.external_provider}. Tutor can recommend but not discuss detailed content — learner views on provider site.]`
  }

  const { data: extRaw } = await admin
    .from('external_course_data' as 'courses')
    .select('section_titles, key_topics, instructor_bio, requires_sign_in, sign_in_instructions')
    .eq('course_id', courseId)
    .maybeSingle()

  type ExtRow = {
    section_titles?: string[]
    key_topics?: string[]
    instructor_bio?: string | null
    requires_sign_in?: boolean
    sign_in_instructions?: string | null
  }
  const ext = extRaw as ExtRow | null

  const meta = (course.external_metadata as Record<string, unknown>) ?? {}
  const ctx = {
    provider: course.external_provider,
    title: course.title,
    instructor: meta.instructor ?? null,
    outline: ext?.section_titles ?? [],
    keyTopics: ext?.key_topics ?? [],
    rating: meta.rating ?? null,
    externalUrl: course.external_url,
    disclaimer: `Content is hosted on ${course.external_provider}. Sudar can discuss topics and outline; learner accesses videos/materials on the provider.`,
  }

  return `EXTERNAL COURSE CONTEXT:\n${JSON.stringify(ctx, null, 2)}`
}

export async function recordExternalCourseEngagement(
  admin: SupabaseClient,
  userId: string,
  courseId: string,
  patch: Partial<ExternalCourseEngagementEntry>,
): Promise<void> {
  const { data: profile } = await admin
    .from('learner_profiles')
    .select('external_course_engagement')
    .eq('user_id', userId)
    .maybeSingle()

  const current = ((profile?.external_course_engagement as ExternalCourseEngagementMap) ?? {}) as ExternalCourseEngagementMap
  const prev = current[courseId] ?? {
    views: 0,
    clicks: 0,
    duration_secs: 0,
    completed: false,
    last_visited: null,
  }

  const next: ExternalCourseEngagementEntry = {
    views: prev.views + (patch.views ?? 0),
    clicks: prev.clicks + (patch.clicks ?? 0),
    duration_secs: prev.duration_secs + (patch.duration_secs ?? 0),
    completed: patch.completed ?? prev.completed,
    last_visited: patch.last_visited ?? prev.last_visited ?? new Date().toISOString(),
  }

  await admin
    .from('learner_profiles')
    .update({
      external_course_engagement: { ...current, [courseId]: next } as Record<string, unknown>,
      last_active_at: new Date().toISOString(),
    })
    .eq('user_id', userId)
}

export async function findExternalCourseForTopic(
  admin: SupabaseClient,
  orgId: string | null,
  topic: string,
  excludeCourseId?: string,
): Promise<{
  id: string
  title: string
  external_provider: string | null
  external_url: string | null
  tags: string[]
} | null> {
  const q = admin
    .from('courses')
    .select('id, title, external_provider, external_url, tags, org_id')
    .eq('status', 'published')
    .eq('is_external', true)
    .limit(20)

  const { data } = orgId ? await q.eq('org_id', orgId) : await q

  const topicLower = topic.toLowerCase()
  const match = (data ?? []).find((c) => {
    if (excludeCourseId && c.id === excludeCourseId) return false
    const hay = [c.title, ...(c.tags ?? [])].join(' ').toLowerCase()
    return hay.includes(topicLower) || topicLower.split(/\s+/).some((w) => w.length > 3 && hay.includes(w))
  })

  return match ?? null
}

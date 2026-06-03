import type { SupabaseClient } from '@supabase/supabase-js'
import type { ContentAccessMode, ExternalCourseMetadata } from '../../../../shared/external-courses/types'
import {
  fetchOrgTagCatalog,
  resolveOrCreateOrgTagsForLabels,
  setCourseOrgTagIds,
} from '@/lib/courseTags'
import { suggestExternalCourseTags } from '@/lib/ai/suggestExternalCourseTags'

export interface ImportExternalCourseInput {
  orgId: string
  userId: string
  metadata: ExternalCourseMetadata
  contentAccessMode: ContentAccessMode
  allowTutorDiscussion?: boolean
  publish?: boolean
  orgTagIds?: string[]
  autoTag?: boolean
  providerSlug: string
}

export interface ImportExternalCourseResult {
  courseId: string
  moduleId: string
  tagIds: string[]
  syncStatus: string
}

function mapDifficulty(raw?: string | null): string {
  const d = (raw ?? 'intermediate').toLowerCase()
  if (d.includes('begin')) return 'beginner'
  if (d.includes('adv') || d.includes('expert')) return 'advanced'
  return 'intermediate'
}

export async function importExternalCourseRecord(
  admin: SupabaseClient,
  input: ImportExternalCourseInput,
): Promise<ImportExternalCourseResult> {
  const now = new Date().toISOString()
  const allowTutor =
    input.allowTutorDiscussion ??
    (input.contentAccessMode !== 'iframe_only')

  const externalMeta = {
    rating: input.metadata.rating ?? null,
    instructor: input.metadata.instructor ?? null,
    duration_hours: input.metadata.durationHours ?? null,
    cert_available: input.metadata.certAvailable ?? false,
    video_count: input.metadata.videoCount ?? null,
    provider_categories: input.metadata.providerCategories ?? [],
    topics: input.metadata.topics ?? [],
  }

  const { data: existing } = await admin
    .from('courses')
    .select('id')
    .eq('org_id', input.orgId)
    .eq('provider_course_id', input.metadata.providerCourseId)
    .eq('external_provider', input.metadata.provider)
    .maybeSingle()

  let courseId = existing?.id as string | undefined

  const courseRow = {
    org_id: input.orgId,
    created_by: input.userId,
    title: input.metadata.title,
    description: input.metadata.description,
    status: input.publish ? 'published' : 'draft',
    difficulty: mapDifficulty(input.metadata.difficulty),
    estimated_duration_mins: input.metadata.estimatedDurationMins ?? null,
    thumbnail_url: input.metadata.thumbnailUrl ?? null,
    is_external: true,
    external_provider: input.metadata.provider,
    external_url: input.metadata.externalUrl,
    embed_url: input.metadata.embedUrl ?? null,
    external_metadata: externalMeta,
    provider_course_id: input.metadata.providerCourseId,
    sync_status: 'synced',
    last_synced_at: now,
    allow_tutor_discussion: allowTutor,
    content_access_mode: input.contentAccessMode,
    published_at: input.publish ? now : null,
    updated_at: now,
    tags: input.metadata.topics ?? [],
  }

  if (courseId) {
    const { error } = await admin.from('courses').update(courseRow).eq('id', courseId)
    if (error) throw new Error(error.message)
  } else {
    const { data: inserted, error } = await admin
      .from('courses')
      .insert({ ...courseRow, created_at: now })
      .select('id')
      .single()
    if (error || !inserted) throw new Error(error?.message ?? 'Failed to create course')
    courseId = inserted.id
  }

  const sectionTitles = (input.metadata.sections ?? []).map((s) => s.title).filter(Boolean)
  const keyTopics = [
    ...(input.metadata.topics ?? []),
    ...(input.metadata.providerCategories ?? []),
  ].filter(Boolean)

  await admin.from('external_course_data' as 'courses').upsert(
    {
      course_id: courseId,
      course_description: input.metadata.description,
      instructor_bio: input.metadata.instructorBio ?? null,
      section_titles: sectionTitles,
      key_topics: [...new Set(keyTopics)].slice(0, 30),
      requires_sign_in: input.metadata.requiresSignIn ?? false,
      sign_in_instructions: input.metadata.signInInstructions ?? null,
      updated_at: now,
    } as never,
    { onConflict: 'course_id' },
  )

  const { data: existingModule } = await admin
    .from('modules')
    .select('id')
    .eq('course_id', courseId)
    .order('order_index', { ascending: true })
    .limit(1)
    .maybeSingle()

  let moduleId = existingModule?.id as string | undefined
  const moduleContent = {
    blocks: [
      {
        type: 'paragraph',
        text: `External course hosted on ${input.metadata.provider}. Complete on the provider site, then mark complete in Sudar.`,
      },
    ],
  }

  if (moduleId) {
    await admin
      .from('modules')
      .update({ title: `${input.metadata.title} — external`, content: moduleContent })
      .eq('id', moduleId)
  } else {
    const { data: mod, error: modErr } = await admin
      .from('modules')
      .insert({
        course_id: courseId,
        title: `${input.metadata.title} — external`,
        content: moduleContent,
        order_index: 0,
      })
      .select('id')
      .single()
    if (modErr || !mod) throw new Error(modErr?.message ?? 'Failed to create module')
    moduleId = mod.id
  }

  let tagIds = input.orgTagIds ?? []
  if (input.autoTag && tagIds.length === 0) {
    const catalog = await fetchOrgTagCatalog(admin, input.orgId)
    const suggestion = await suggestExternalCourseTags(input.metadata, catalog)
    const labels = suggestion.suggestedLabels
    const created = await resolveOrCreateOrgTagsForLabels(admin, input.orgId, labels, catalog)
    tagIds = [...new Set([...suggestion.matchedTagIds, ...created])]
  }

  if (tagIds.length > 0) {
    await setCourseOrgTagIds(admin, courseId, tagIds)
  }

  await admin.from('external_course_sync_log' as 'courses').insert({
    org_id: input.orgId,
    provider: input.providerSlug,
    status: 'synced',
    courses_imported: 1,
  } as never)

  return { courseId, moduleId: moduleId!, tagIds, syncStatus: 'synced' }
}

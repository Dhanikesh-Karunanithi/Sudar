import type { SupabaseClient } from '@supabase/supabase-js'
import { embedTexts, EMBED_DIMENSIONS } from '@/lib/embed'
import { extractExternalCourseChunks } from '@/lib/rag/extractExternalCourseChunks'

export async function ingestExternalCourseRag(
  admin: SupabaseClient,
  courseId: string,
): Promise<{ indexed: number }> {
  const { data: course, error } = await admin
    .from('courses')
    .select('id, org_id, title, description, tags, external_provider, external_metadata')
    .eq('id', courseId)
    .eq('is_external', true)
    .maybeSingle()

  if (error || !course) throw new Error(error?.message ?? 'External course not found')

  const { data: ext } = await admin
    .from('external_course_data' as 'courses')
    .select('course_description, instructor_bio, section_titles, key_topics')
    .eq('course_id', courseId)
    .maybeSingle()

  type ExtRow = {
    course_description?: string | null
    instructor_bio?: string | null
    section_titles?: string[]
    key_topics?: string[]
  }
  const extRow = ext as ExtRow | null

  const meta = (course.external_metadata as Record<string, unknown>) ?? {}
  const sectionTitles = extRow?.section_titles ?? []
  const sections = sectionTitles.map((title) => ({ title }))
  const topics = [
    ...(extRow?.key_topics ?? []),
    ...((course.tags as string[]) ?? []),
    ...((meta.topics as string[]) ?? []),
  ]

  const textChunks = extractExternalCourseChunks({
    title: course.title,
    description: extRow?.course_description ?? course.description,
    instructor: (meta.instructor as string) ?? null,
    instructorBio: extRow?.instructor_bio ?? null,
    sections,
    topics: [...new Set(topics)],
    provider: course.external_provider,
  })

  if (textChunks.length === 0) return { indexed: 0 }

  const embeddings = await embedTexts(textChunks)
  if (embeddings.some((e) => e.length !== EMBED_DIMENSIONS)) {
    throw new Error('Embedding failed for external course')
  }

  await admin.from('content_chunks').delete().eq('course_id', courseId)

  const rows = textChunks.map((content, i) => ({
    course_id: courseId,
    module_id: null,
    chunk_index: i,
    chunk_type: 'course' as const,
    content,
    embedding: embeddings[i] ?? [],
    metadata: { external: true, provider: course.external_provider },
  }))

  const { error: insertError } = await admin.from('content_chunks').insert(rows)
  if (insertError) throw new Error(insertError.message)

  await admin
    .from('courses')
    .update({ sync_status: 'synced', last_synced_at: new Date().toISOString() })
    .eq('id', courseId)

  return { indexed: rows.length }
}

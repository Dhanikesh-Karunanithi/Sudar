/**
 * RAG retrieval: embed query and fetch top-k similar chunks from Supabase content_chunks.
 * Requires pgvector and content_chunks table (see supabase/migrations).
 */

import { createAdminClient } from '@/lib/supabase/server'
import { embedText, EMBED_DIMENSIONS } from '@/lib/embed'

export interface ContentChunk {
  id: string
  course_id: string | null
  module_id: string | null
  chunk_index: number
  chunk_type: string
  content: string
  metadata: Record<string, unknown>
  similarity?: number
}

export interface RetrieveOptions {
  limit?: number
  courseId?: string | null
  chunkType?: string | null
}

/**
 * Retrieve top-k chunks similar to the query text.
 * Returns [] if embedding fails or table/rpc is missing.
 */
export async function retrieveChunks(
  queryText: string,
  options: RetrieveOptions = {}
): Promise<ContentChunk[]> {
  const { limit = 10, courseId = null, chunkType = null } = options
  const embedding = await embedText(queryText)
  if (embedding.length !== EMBED_DIMENSIONS) return []

  const admin = createAdminClient()
  try {
    const { data, error } = await (admin as { rpc: (name: string, params: object) => Promise<{ data: unknown; error: unknown }> }).rpc('match_content_chunks', {
      query_embedding: embedding,
      match_count: limit,
      filter_course_id: courseId,
      filter_chunk_type: chunkType,
    })
    if (error) return []
    const rows = (data ?? []) as Array<{
      id: string
      course_id: string | null
      module_id: string | null
      chunk_index: number
      chunk_type: string
      content: string
      metadata: Record<string, unknown>
      similarity?: number
    }>
    return rows.map((r) => ({
      id: r.id,
      course_id: r.course_id ?? null,
      module_id: r.module_id ?? null,
      chunk_index: r.chunk_index ?? 0,
      chunk_type: r.chunk_type ?? 'course',
      content: r.content ?? '',
      metadata: r.metadata ?? {},
      similarity: r.similarity,
    }))
  } catch {
    return []
  }
}

/**
 * RAG retrieval: embed query and fetch top-k similar chunks from Supabase content_chunks.
 * Optional HF cross-encoder reranking when RAG_RERANK_ENABLED=true.
 */

import { createServiceRoleSupabaseClient } from '@/lib/supabase/server'
import { embedText, EMBED_DIMENSIONS } from '@/lib/embed'
import { recordAiUnits } from '@/lib/ai/recordUsage'
import { estimateEmbeddingTokensFromText } from '../../../../shared/ai/estimateCost'
import { isRagRerankEnabled } from '@/lib/hf/client'
import { rerankChunks } from '@/lib/rag/rerank'

export interface ContentChunk {
  id: string
  course_id: string | null
  module_id: string | null
  kb_id?: string | null
  chunk_index: number
  chunk_type: string
  content: string
  metadata: Record<string, unknown>
  similarity?: number
}

export interface RetrieveOptions {
  limit?: number
  courseId?: string | null
  moduleId?: string | null
  chunkType?: string | null
  /** When set, restrict to these knowledge base IDs (kb chunks). */
  kbIds?: string[] | null
  /** When true, fetch more candidates for reranking (default: follows RAG_RERANK_ENABLED). */
  rerank?: boolean
  /** When set, records embedding usage for RAG query metering. */
  usage?: {
    orgId: string
    userId: string
    admin: Parameters<typeof recordAiUnits>[0]
  }
}

const RERANK_CANDIDATE_MULTIPLIER = 2

/**
 * Retrieve top-k chunks similar to the query text.
 * Returns [] if embedding fails or table/rpc is missing.
 */
export async function retrieveChunks(
  queryText: string,
  options: RetrieveOptions = {}
): Promise<ContentChunk[]> {
  const { limit = 10, courseId = null, chunkType = null, kbIds = null, rerank } = options
  const useRerank = rerank ?? isRagRerankEnabled()
  const fetchCount = useRerank ? Math.min(limit * RERANK_CANDIDATE_MULTIPLIER, 20) : limit

  const embedding = await embedText(queryText)
  if (embedding.length !== EMBED_DIMENSIONS) return []

  if (options.usage) {
    const estTokens = estimateEmbeddingTokensFromText(queryText)
    recordAiUnits(options.usage.admin, {
      orgId: options.usage.orgId,
      userId: options.usage.userId,
      surface: 'learn',
      feature: 'rag_query',
      route: '/api/tutor/query',
      provider: process.env.EMBED_PROVIDER?.trim() || 'together',
      model: process.env.EMBED_MODEL?.trim() || 'embed',
      unitType: 'embedding_tokens',
      units: estTokens,
      metadata: { course_id: courseId ?? undefined },
    })
  }

  const admin = createServiceRoleSupabaseClient()
  try {
    const { data, error } = await (admin as { rpc: (name: string, params: object) => Promise<{ data: unknown; error: unknown }> }).rpc('match_content_chunks', {
      query_embedding: embedding,
      match_count: fetchCount,
      filter_course_id: courseId,
      filter_chunk_type: chunkType,
      filter_kb_ids: kbIds?.length ? kbIds : null,
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
      kb_id?: string | null
      similarity?: number
    }>
    const chunks: ContentChunk[] = rows.map((r) => ({
      id: r.id,
      course_id: r.course_id ?? null,
      module_id: r.module_id ?? null,
      kb_id: r.kb_id ?? null,
      chunk_index: r.chunk_index ?? 0,
      chunk_type: r.chunk_type ?? 'course',
      content: r.content ?? '',
      metadata: r.metadata ?? {},
      similarity: r.similarity,
    }))

    if (useRerank && chunks.length > 1) {
      return rerankChunks(queryText, chunks, limit)
    }
    return chunks.slice(0, limit)
  } catch {
    return []
  }
}

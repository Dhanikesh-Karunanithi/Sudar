/**
 * Optional cross-encoder reranking for RAG retrieval (HF bge-reranker-v2-m3).
 */

import type { ContentChunk } from '@/lib/rag/retrieve'
import { hfRerank, isRagRerankEnabled } from '@/lib/hf/client'

/**
 * Rerank chunks by relevance to query. Falls back to original order on failure.
 */
export async function rerankChunks(
  query: string,
  chunks: ContentChunk[],
  topK: number
): Promise<ContentChunk[]> {
  if (!isRagRerankEnabled() || chunks.length <= 1) {
    return chunks.slice(0, topK)
  }

  const passages = chunks.map((c) => c.content)
  const order = await hfRerank(query, passages)
  const reordered = order
    .map((i) => chunks[i])
    .filter((c): c is ContentChunk => !!c)
    .slice(0, topK)

  return reordered.length > 0 ? reordered : chunks.slice(0, topK)
}

/**
 * Simple text chunking for RAG ingest (~600 chars with overlap).
 */

const CHUNK_SIZE = 600
const CHUNK_OVERLAP = 100

export interface TextChunk {
  content: string
  chunk_index: number
}

/**
 * Split text into overlapping chunks for embedding.
 */
export function chunkText(text: string, maxChunks = 50): TextChunk[] {
  const normalized = text.replace(/\s+/g, ' ').trim()
  if (!normalized) return []

  const chunks: TextChunk[] = []
  let start = 0
  let index = 0

  while (start < normalized.length && index < maxChunks) {
    const end = Math.min(start + CHUNK_SIZE, normalized.length)
    const slice = normalized.slice(start, end).trim()
    if (slice) {
      chunks.push({ content: slice, chunk_index: index })
      index++
    }
    if (end >= normalized.length) break
    start = Math.max(0, end - CHUNK_OVERLAP)
  }

  return chunks
}

export function extractModuleBody(content: {
  type?: string
  body?: string
  scorm_text_content?: string
} | null): string {
  if (!content) return ''
  if (content.type === 'scorm') {
    return (content.scorm_text_content ?? '').trim()
  }
  return (content.body ?? '').trim()
}

/**
 * Chunk external course metadata for RAG (tutor context when full modules are absent).
 */

export interface ExternalChunkInput {
  title: string
  description?: string | null
  instructor?: string | null
  instructorBio?: string | null
  sections?: { title: string; description?: string }[]
  topics?: string[]
  provider?: string | null
}

export function extractExternalCourseChunks(input: ExternalChunkInput): string[] {
  const parts: string[] = []

  const header = [`[External course: ${input.title}]`, input.provider ? `Provider: ${input.provider}` : '']
    .filter(Boolean)
    .join('\n')
  parts.push(header)

  if (input.description?.trim()) {
    parts.push(input.description.trim().slice(0, 4000))
  }

  if (input.instructor) {
    parts.push(`Instructor: ${input.instructor}`)
  }

  if (input.instructorBio?.trim()) {
    parts.push(`Instructor bio: ${input.instructorBio.trim().slice(0, 1500)}`)
  }

  if (input.sections?.length) {
    const outline = input.sections
      .map((s, i) => `${i + 1}. ${s.title}${s.description ? ` — ${s.description.slice(0, 200)}` : ''}`)
      .join('\n')
    parts.push(`Course outline:\n${outline}`)
  }

  if (input.topics?.length) {
    parts.push(`Key topics: ${input.topics.join(', ')}`)
  }

  const combined = parts.join('\n\n')
  const maxChunk = 2000
  if (combined.length <= maxChunk) return [combined]

  const chunks: string[] = []
  for (let i = 0; i < combined.length; i += maxChunk) {
    chunks.push(combined.slice(i, i + maxChunk))
  }
  return chunks
}

import { z } from 'zod'
import { chatCompletion, type ChatCompletionContext } from '@/lib/ai/chat'

const MAX_DESCRIPTION_LEN = 580

const metadataSchema = z.object({
  description: z.string().min(1).max(MAX_DESCRIPTION_LEN + 80),
  tag_labels: z.array(z.string().min(1).max(64)).max(10),
})

export type CourseMetadataPromptInput = {
  title: string
  /** Author intent — not the final marketing copy. */
  brief?: string | null
  difficulty?: string
  target_audience?: string
  learning_outcomes?: string[]
  tone?: string
  industry?: string
  /** Long excerpt for document-sourced courses. */
  document_excerpt?: string
}

function extractJsonObject(raw: string): string {
  let s = raw.trim()
  const fence = s.match(/^```(?:json)?\s*([\s\S]*?)```\s*$/m)
  if (fence) s = fence[1].trim()
  const start = s.indexOf('{')
  const end = s.lastIndexOf('}')
  if (start === -1 || end <= start) return s
  return s.slice(start, end + 1)
}

function repairJson(s: string): string {
  return s.replace(/,(\s*[}\]])/g, '$1')
}

/**
 * Produces learner-facing description + categorization tags (labels only).
 * Callers resolve labels to org master tags via `resolveOrCreateOrgTagsForLabels`.
 */
export async function generateCourseMetadata(
  input: CourseMetadataPromptInput,
  chatAiCtx: ChatCompletionContext
): Promise<{ description: string; tag_labels: string[] }> {
  const lines: string[] = [
    `Course title: "${input.title.trim()}"`,
    `Difficulty: ${input.difficulty ?? 'intermediate'}`,
  ]
  if (input.brief?.trim()) lines.push(`Author brief (intent, not final copy):\n${input.brief.trim()}`)
  if (input.target_audience?.trim()) lines.push(`Target audience: ${input.target_audience.trim()}`)
  if (input.learning_outcomes?.length) {
    lines.push(`Learning outcomes:\n${input.learning_outcomes.map((o) => `- ${o}`).join('\n')}`)
  }
  if (input.tone?.trim()) lines.push(`Tone: ${input.tone.trim()}`)
  if (input.industry?.trim()) lines.push(`Industry / domain: ${input.industry.trim()}`)
  if (input.document_excerpt?.trim()) {
    lines.push(`Source document excerpt:\n${input.document_excerpt.trim().slice(0, 12000)}`)
  }

  const userPrompt = `${lines.join('\n\n')}

Return ONLY valid JSON (no markdown) with this shape:
{"description":"<2-4 short sentences, plain text, no markdown, learner-facing>","tag_labels":["tag1","tag2",...]}

Rules:
- description: compelling summary, max ${MAX_DESCRIPTION_LEN} characters.
- tag_labels: 3 to 8 short labels for search and catalog (topics, level, domain). Prefer Title Case or lowercase phrases under 40 chars each.
- Do not repeat the title verbatim in every tag.`

  const { content } = await chatCompletion(
    {
      messages: [
        { role: 'system', content: 'You write course catalog metadata for an LMS. Output strict JSON only.' },
        { role: 'user', content: userPrompt },
      ],
      max_tokens: 700,
      temperature: 0.55,
    },
    chatAiCtx
  )

  if (!content?.trim()) throw new Error('AI returned empty metadata')

  let parsed: unknown
  try {
    parsed = JSON.parse(repairJson(extractJsonObject(content)))
  } catch {
    throw new Error('AI metadata was not valid JSON')
  }

  const validated = metadataSchema.safeParse(parsed)
  if (!validated.success) {
    throw new Error('AI metadata failed validation')
  }

  let description = validated.data.description.replace(/\s+/g, ' ').trim()
  if (description.length > MAX_DESCRIPTION_LEN) {
    description = `${description.slice(0, MAX_DESCRIPTION_LEN - 1).trim()}…`
  }

  let tag_labels = [...new Set(validated.data.tag_labels.map((t) => t.trim()).filter(Boolean))].slice(0, 8)
  if (tag_labels.length === 0) {
    tag_labels = [input.title.trim().split(/\s+/).slice(0, 3).join(' ') || 'Course']
  }

  return { description, tag_labels }
}

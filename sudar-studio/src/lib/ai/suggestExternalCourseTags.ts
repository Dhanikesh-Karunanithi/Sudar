import { chatCompletion } from '@/lib/ai/chat'
import type { OrgTagRow } from '@/lib/courseTags'
import type { ExternalCourseMetadata } from '@/lib/providers/types'
import { z } from 'zod'

const tagSuggestionSchema = z.object({
  matched_tag_ids: z.array(z.string()).default([]),
  suggested_labels: z.array(z.string()).default([]),
  confidence: z.number().min(0).max(1).default(0.5),
  reason: z.string().default(''),
})

export interface ExternalCourseTagSuggestion {
  matchedTagIds: string[]
  suggestedLabels: string[]
  confidence: number
  reason: string
}

export async function suggestExternalCourseTags(
  course: ExternalCourseMetadata,
  orgTags: OrgTagRow[],
): Promise<ExternalCourseTagSuggestion> {
  const tagList = orgTags.map((t) => `- id: ${t.id} | label: ${t.label}`).join('\n')
  const prompt = `You are tagging an external course for a corporate learning catalog.

Course title: ${course.title}
Description: ${course.description ?? 'N/A'}
Instructor: ${course.instructor ?? 'N/A'}
Topics: ${(course.topics ?? []).join(', ') || 'N/A'}
Provider categories: ${(course.providerCategories ?? []).join(', ') || 'N/A'}

Available org tags:
${tagList || '(none yet)'}

Return ONLY valid JSON:
{
  "matched_tag_ids": ["uuid of existing tags that fit"],
  "suggested_labels": ["3-5 new tag labels if gaps exist"],
  "confidence": 0.0-1.0,
  "reason": "one sentence why these tags fit"
}

Rules: matched_tag_ids must be from the list above. suggested_labels are human-readable labels (not slugs).`

  try {
    const { content } = await chatCompletion({
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 400,
      temperature: 0.2,
    })
    const jsonMatch = content?.match(/\{[\s\S]*\}/)
    if (!jsonMatch) throw new Error('No JSON')
    const parsed = tagSuggestionSchema.parse(JSON.parse(jsonMatch[0]))
    const validIds = new Set(orgTags.map((t) => t.id))
    return {
      matchedTagIds: parsed.matched_tag_ids.filter((id) => validIds.has(id)),
      suggestedLabels: parsed.suggested_labels.slice(0, 6),
      confidence: parsed.confidence,
      reason: parsed.reason,
    }
  } catch {
    const fallbackLabels = [
      ...(course.topics ?? []).slice(0, 3),
      ...(course.providerCategories ?? []).slice(0, 2),
      'external-course',
    ].filter(Boolean)
    return {
      matchedTagIds: [],
      suggestedLabels: [...new Set(fallbackLabels)],
      confidence: 0.35,
      reason: 'Fallback tags from provider metadata.',
    }
  }
}

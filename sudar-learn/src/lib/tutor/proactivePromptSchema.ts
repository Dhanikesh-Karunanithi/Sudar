import { z } from 'zod'

export const proactiveChoiceSchema = z.object({
  id: z.string().min(1).max(64),
  label: z.string().min(1).max(120),
  follow_up_message: z.string().max(2000).optional(),
})

export const proactivePromptBodySchema = z.object({
  trigger: z.enum(['session_start', 'route_change']),
  route: z.string().max(240).optional(),
})

export const proactiveNudgeLlmSchema = z.object({
  message: z.string().min(1).max(500),
  choices: z.array(proactiveChoiceSchema).min(2).max(5),
})

export const proactiveReplyBodySchema = z.object({
  trigger: z.string().min(1).max(80),
  choice_id: z.string().min(1).max(64),
  choice_label: z.string().max(200).optional(),
  follow_up_message: z.string().max(2000).optional(),
  course_id: z.string().uuid().optional(),
  module_id: z.string().uuid().optional(),
})

export type ProactiveChoiceParsed = z.infer<typeof proactiveChoiceSchema>
export type ProactiveNudgeLlmParsed = z.infer<typeof proactiveNudgeLlmSchema>

export function parseProactiveNudgeJson(raw: string): ProactiveNudgeLlmParsed | null {
  const trimmed = raw.trim()
  const start = trimmed.indexOf('{')
  const end = trimmed.lastIndexOf('}')
  if (start === -1 || end <= start) return null
  const slice = trimmed.slice(start, end + 1)
  try {
    const parsed = JSON.parse(slice) as unknown
    const out = proactiveNudgeLlmSchema.safeParse(parsed)
    return out.success ? out.data : null
  } catch {
    return null
  }
}

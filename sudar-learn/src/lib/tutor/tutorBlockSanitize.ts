import { z } from 'zod'
import { isSafeTutorHttpUrl } from '@/lib/tutor/tutorBlockUrl'
import { TUTOR_BLOCK_TYPES, type TutorBlock } from '@/types/tutor'
import { tutorActionSchema } from './tutorBlockSchemas'

const MAX_CHOICES = 6
const choiceItemSchema = z.object({
  id: z.string().trim().min(1).max(32),
  label: z.string().trim().min(1).max(120),
  follow_up_message: z.string().max(800).optional(),
})

const choiceGroupPayloadSchema = z.object({
  question: z.string().max(220).optional(),
  choices: z.array(choiceItemSchema).min(1).max(MAX_CHOICES),
  mode: z.enum(['single']).optional(),
})

const conceptCardPayloadSchema = z.object({
  title: z.string().trim().min(1).max(160),
  key_idea: z.string().trim().min(1).max(2000),
  analogy: z.string().max(800).optional(),
  misconception: z.string().max(800).optional(),
})

const diagramPayloadSchema = z.object({
  title: z.string().max(160).optional(),
  nodes: z
    .array(
      z.object({
        id: z.string().trim().min(1).max(32),
        label: z.string().trim().min(1).max(120),
      }),
    )
    .min(1)
    .max(20),
  edges: z
    .array(
      z.object({
        from: z.string().trim().min(1).max(32),
        to: z.string().trim().min(1).max(32),
        label: z.string().max(80).optional(),
      }),
    )
    .max(40)
    .optional(),
})

const timelinePayloadSchema = z.object({
  title: z.string().max(160).optional(),
  items: z
    .array(
      z.object({
        id: z.string().trim().min(1).max(32),
        title: z.string().trim().min(1).max(200),
        description: z.string().max(500).optional(),
      }),
    )
    .min(1)
    .max(12),
})

const mediaCardPayloadSchema = z.object({
  title: z.string().trim().min(1).max(200),
  snippet: z.string().max(1200).optional(),
  image_url: z.string().max(2048).optional(),
  link_url: z.string().max(2048).optional(),
  attribution: z.string().max(300).optional(),
  source_label: z.string().max(80).optional(),
})

const interactivePayloadSchema = z.object({
  component_id: z.enum(['molecule_viewer', 'cell_model', 'physics_demo', 'placeholder']),
  label: z.string().max(120).optional(),
  params: z.record(z.unknown()).optional(),
})

const textPayloadSchema = z.object({ content: z.string().max(100_000) })
const actionGroupPayloadSchema = z.object({ actions: z.array(tutorActionSchema) })
const cardPayloadSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
  image_url: z.string().max(2048).optional(),
  action: tutorActionSchema.optional(),
})
const workflowPayloadSchema = z.object({
  workflow_id: z.string().min(1).max(80),
  name: z.string().min(1).max(120),
  steps: z.array(z.string().max(300)),
  current_step_index: z.number().int().min(0),
  status: z.enum(['running', 'done', 'error']),
  summary: z.string().max(2000).optional(),
})
const externalActionPayloadSchema = z.object({
  app_id: z.string().min(1).max(80),
  label: z.string().min(1).max(120),
  payload: z.record(z.unknown()).optional().default({}),
})
const quizOptionSchema = z.object({
  id: z.string().min(1).max(8),
  text: z.string().min(1).max(500),
  correct: z.boolean(),
  explanation: z.string().max(800),
})
const quizPayloadSchema = z.object({
  question: z.string().min(1).max(800),
  options: z.array(quizOptionSchema).min(2).max(6),
  topic: z.string().min(1).max(200),
  difficulty: z.enum(['recall', 'application', 'challenge']),
})

function mediaPayloadWithUrlChecks(
  p: z.infer<typeof mediaCardPayloadSchema>,
): z.infer<typeof mediaCardPayloadSchema> {
  if (p.image_url && !isSafeTutorHttpUrl(p.image_url)) {
    return { ...p, image_url: undefined }
  }
  if (p.link_url && !isSafeTutorHttpUrl(p.link_url)) {
    return { ...p, link_url: undefined }
  }
  return p
}

function cardPayloadWithImageCheck(
  p: z.infer<typeof cardPayloadSchema>,
): z.infer<typeof cardPayloadSchema> {
  if (p.image_url && !isSafeTutorHttpUrl(p.image_url)) {
    return { ...p, image_url: undefined }
  }
  if (p.action && !tutorActionSchema.safeParse(p.action).success) {
    const { action, ...rest } = p
    void action
    return rest
  }
  return p
}

function normalizeChoiceGroup(
  p: z.infer<typeof choiceGroupPayloadSchema>,
): z.infer<typeof choiceGroupPayloadSchema> {
  return {
    ...p,
    choices: p.choices.map((c) => ({
      id: c.id,
      label: c.label,
      follow_up_message:
        c.follow_up_message?.trim() ||
        c.label,
    })),
  }
}

const allowedTypes = new Set<string>(TUTOR_BLOCK_TYPES)

/**
 * Returns a single validated block, or null if invalid.
 */
export function sanitizeTutorBlock(raw: unknown): TutorBlock | null {
  if (!raw || typeof raw !== 'object') return null
  const o = raw as { id?: unknown; type?: unknown; payload?: unknown }
  const id = typeof o.id === 'string' ? o.id.trim().slice(0, 64) : ''
  const type = typeof o.type === 'string' ? o.type.trim() : ''
  if (!id || !allowedTypes.has(type)) return null

  switch (type) {
    case 'text': {
      const p = textPayloadSchema.safeParse(o.payload)
      if (!p.success) return null
      return { id, type: 'text', payload: p.data as unknown as Record<string, unknown> }
    }
    case 'action_group': {
      const p = actionGroupPayloadSchema.safeParse(o.payload)
      if (!p.success) return null
      return { id, type: 'action_group', payload: p.data as unknown as Record<string, unknown> }
    }
    case 'card': {
      const p = cardPayloadSchema.safeParse(o.payload)
      if (!p.success) return null
      return {
        id,
        type: 'card',
        payload: cardPayloadWithImageCheck(p.data) as unknown as Record<string, unknown>,
      }
    }
    case 'workflow_status': {
      const p = workflowPayloadSchema.safeParse(o.payload)
      if (!p.success) return null
      return { id, type: 'workflow_status', payload: p.data as unknown as Record<string, unknown> }
    }
    case 'external_action': {
      const p = externalActionPayloadSchema.safeParse(o.payload)
      if (!p.success) return null
      return { id, type: 'external_action', payload: p.data as unknown as Record<string, unknown> }
    }
    case 'quiz': {
      const p = quizPayloadSchema.safeParse(o.payload)
      if (!p.success) return null
      return { id, type: 'quiz', payload: p.data as unknown as Record<string, unknown> }
    }
    case 'choice_group': {
      const p = choiceGroupPayloadSchema.safeParse(o.payload)
      if (!p.success) return null
      return {
        id,
        type: 'choice_group',
        payload: normalizeChoiceGroup(p.data) as unknown as Record<string, unknown>,
      }
    }
    case 'concept_card': {
      const p = conceptCardPayloadSchema.safeParse(o.payload)
      if (!p.success) return null
      return { id, type: 'concept_card', payload: p.data as unknown as Record<string, unknown> }
    }
    case 'diagram': {
      const p = diagramPayloadSchema.safeParse(o.payload)
      if (!p.success) return null
      return { id, type: 'diagram', payload: p.data as unknown as Record<string, unknown> }
    }
    case 'timeline': {
      const p = timelinePayloadSchema.safeParse(o.payload)
      if (!p.success) return null
      return { id, type: 'timeline', payload: p.data as unknown as Record<string, unknown> }
    }
    case 'media_card': {
      const p = mediaCardPayloadSchema.safeParse(o.payload)
      if (!p.success) return null
      return {
        id,
        type: 'media_card',
        payload: mediaPayloadWithUrlChecks(p.data) as unknown as Record<string, unknown>,
      }
    }
    case 'interactive_demo': {
      const p = interactivePayloadSchema.safeParse(o.payload)
      if (!p.success) return null
      const params = p.data.params ?? {}
      const safeParams: Record<string, unknown> = {}
      for (const [k, v] of Object.entries(params)) {
        if (k.length > 64) continue
        if (
          typeof v === 'string' ||
          typeof v === 'number' ||
          typeof v === 'boolean' ||
          v === null
        ) {
          safeParams[k] = v
        }
      }
      return {
        id,
        type: 'interactive_demo',
        payload: { ...p.data, params: safeParams } as unknown as Record<string, unknown>,
      }
    }
    default:
      return null
  }
}

export function sanitizeTutorBlocks(raw: unknown): TutorBlock[] {
  if (!Array.isArray(raw)) return []
  const out: TutorBlock[] = []
  for (const item of raw) {
    const b = sanitizeTutorBlock(item)
    if (b) out.push(b)
  }
  return out
}

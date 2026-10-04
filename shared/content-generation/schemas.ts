import { z } from 'zod'

export const quizQuestionSchema = z.object({
  id: z.string(),
  question: z.string(),
  options: z.array(z.string()).min(2).max(6),
  correct: z.number().int().min(0),
  explanation: z.string().optional(),
  topic: z.string().optional(),
})

export const quizResultSchema = z.object({
  questions: z.array(quizQuestionSchema),
})

export const flashcardPairSchema = z.object({
  front: z.string(),
  back: z.string(),
})

export const flashcardsResultSchema = z.object({
  cards: z.array(flashcardPairSchema),
})

export const interactiveElementSchema = z.object({
  type: z.enum([
    'quiz',
    'expandable',
    'timeline',
    'flipcard',
    'hotspot',
    'matching',
    'tabs',
    'flashcard',
  ]),
  data: z.record(z.string(), z.unknown()).optional(),
})

export const interactiveResultSchema = z.object({
  interactive_elements: z.array(interactiveElementSchema),
})

export const exportFormatSchema = z.enum(['json', 'scorm12', 'embed'])

export const createQuizRequestSchema = z.object({
  creator_user_id: z.string().uuid().optional(),
  content: z.string().min(1).max(400_000),
  course_title: z.string().max(200).optional(),
  module_title: z.string().max(200).optional(),
  difficulty: z.enum(['beginner', 'intermediate', 'advanced']).optional(),
  num_questions: z.number().int().min(1).max(15).optional(),
  export_format: exportFormatSchema.optional(),
  language: z.string().max(16).optional(),
  emit_xapi: z.boolean().optional(),
})

export const createInteractiveRequestSchema = z.object({
  creator_user_id: z.string().uuid().optional(),
  content: z.string().min(1).max(400_000),
  title: z.string().max(200).optional(),
  component_types: z
    .array(z.enum(['timeline', 'flipcard', 'hotspot', 'matching', 'tabs', 'quiz', 'expandable']))
    .optional(),
  image_url: z.string().url().optional(),
  export_format: exportFormatSchema.optional(),
  language: z.string().max(16).optional(),
})

export const createFlashcardsRequestSchema = z.object({
  creator_user_id: z.string().uuid().optional(),
  content: z.string().min(1).max(400_000),
  module_title: z.string().max(200).optional(),
  export_format: exportFormatSchema.optional(),
  language: z.string().max(16).optional(),
})

export const createOutlineRequestSchema = z.object({
  creator_user_id: z.string().uuid().optional(),
  course_title: z.string().min(1).max(200),
  description: z.string().max(4000).optional(),
  difficulty: z.enum(['beginner', 'intermediate', 'advanced']).optional(),
  num_modules: z.number().int().min(2).max(20).optional(),
  language: z.string().max(16).optional(),
})

export const createFromDocumentRequestSchema = z.object({
  creator_user_id: z.string().uuid(),
  text: z.string().max(400_000).optional(),
  url: z.string().url().optional(),
  course_title: z.string().max(200).optional(),
  difficulty: z.enum(['beginner', 'intermediate', 'advanced']).optional(),
  export_format: exportFormatSchema.optional(),
  webhook_url: z.string().url().optional(),
  language: z.string().max(16).optional(),
})

export const createMediaRequestSchema = z.object({
  creator_user_id: z.string().uuid(),
  content: z.string().min(1).max(400_000),
  title: z.string().max(200).optional(),
  media_type: z.enum(['podcast', 'video']),
  webhook_url: z.string().url().optional(),
  language: z.string().max(16).optional(),
})

export const entryStateSchema = z.object({
  type: z.enum(['provocation', 'data-drop', 'scenario-fragment', 'contrarian-claim']),
  content: z.string().min(1).max(600),
})

export const exitStateSchema = z.object({
  type: z.enum(['reflection', 'apply-24h', 'next-conflict-teaser', 'what-changed']),
  content: z.string().min(1).max(800),
})

export const sideCardSchema = z.object({
  title: z.string().min(1).max(120),
  content: z.string().min(1).max(1200),
  noteType: z.enum(['wait-but-why', 'real-world', 'brain-moment', 'expert-voice', 'rabbit-hole']),
  visibility: z.enum(['hidden', 'floating', 'visible']).catch('hidden'),
})

/** LLM envelope around a module body. Invalid parts degrade to null instead of failing the module. */
export const moduleEnvelopeSchema = z.object({
  entryState: entryStateSchema.nullable().catch(null).optional(),
  exitState: exitStateSchema.nullable().catch(null).optional(),
  sideCard: sideCardSchema.nullable().catch(null).optional(),
})

export const richSectionSchema = z.object({
  heading: z.string().default(''),
  content: z.string().default(''),
  type: z.string().optional(),
  items: z.array(z.unknown()).optional(),
  image: z.unknown().optional(),
})

export const richInteractiveSchema = z.object({
  type: z.string(),
  data: z.record(z.string(), z.unknown()).default({}),
  quizMode: z.string().optional(),
})

export const moduleSourceSchema = z.object({
  id: z.number().int().positive(),
  title: z.string(),
  url: z.string().optional(),
  citation: z.string().optional(),
})

/** Canonical shape stored in `modules.content` when `type === 'rich'`. */
export const richModuleContentSchema = z.object({
  type: z.literal('rich'),
  archetype: z.string().optional(),
  entryState: entryStateSchema.nullable().optional(),
  exitState: exitStateSchema.nullable().optional(),
  sideCard: sideCardSchema.nullable().optional(),
  sections: z.array(richSectionSchema).min(1),
  interactiveElements: z.array(richInteractiveSchema).default([]),
  learning_objectives: z.array(z.string()).optional(),
  sources: z.array(moduleSourceSchema).optional(),
})

export type ModuleEnvelope = z.infer<typeof moduleEnvelopeSchema>
export type RichModuleContent = z.infer<typeof richModuleContentSchema>
export type ModuleSource = z.infer<typeof moduleSourceSchema>

export type QuizQuestion = z.infer<typeof quizQuestionSchema>
export type QuizResult = z.infer<typeof quizResultSchema>
export type FlashcardPair = z.infer<typeof flashcardPairSchema>
export type InteractiveElement = z.infer<typeof interactiveElementSchema>
export type ExportFormat = z.infer<typeof exportFormatSchema>

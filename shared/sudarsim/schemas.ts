import { z } from 'zod'

export const SIM_LOCALES = ['en', 'fr', 'es', 'pt', 'ta'] as const
export type SimLocale = (typeof SIM_LOCALES)[number]

export const simChannelSchema = z.object({
  phone: z.boolean().default(true),
  chat: z.boolean().default(true),
  email: z.boolean().default(true),
})

export const simPersonaSchema = z.object({
  name: z.string().min(1),
  backstory: z.string().default(''),
  objectives: z.array(z.string()).default([]),
  voice_id: z.string().optional(),
  initial_mood: z.number().min(0).max(1).default(0.5),
  opening_line: z.string().optional(),
})

export const simRubricDimensionSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  description: z.string().default(''),
  weight: z.number().min(0).max(1).default(0.2),
  must_pass: z.boolean().default(false),
})

export const simRubricSchema = z.object({
  dimensions: z.array(simRubricDimensionSchema).min(1),
})

export const simCompletionRuleSchema = z.object({
  enabled: z.boolean().default(false),
  min_overall_score: z.number().min(0).max(100).default(70),
  require_must_pass: z.boolean().default(true),
})

export const simComplianceSchema = z.object({
  record_audio: z.boolean().default(false),
  record_transcript: z.boolean().default(true),
  retention_days: z.number().int().positive().nullable().default(90),
})

export const crmOverlayTypeSchema = z.enum([
  'text_input',
  'textarea',
  'dropdown',
  'button',
  'search',
  'readonly_field',
  'tab',
  'link',
])

export const crmOverlaySchema = z.object({
  id: z.string().min(1),
  type: crmOverlayTypeSchema,
  x: z.number().min(0).max(1),
  y: z.number().min(0).max(1),
  w: z.number().min(0).max(1),
  h: z.number().min(0).max(1),
  label: z.string().default(''),
  config: z.record(z.unknown()).default({}),
  required_for_score: z.boolean().default(false),
})

export const simCrmSkinSchema = z.object({
  image_url: z.string().url(),
  width: z.number().int().positive().default(1920),
  height: z.number().int().positive().default(1080),
  overlays: z.array(crmOverlaySchema).default([]),
})

export const simScenarioSchema = z.object({
  id: z.string().uuid().optional(),
  org_id: z.string().uuid().optional(),
  created_by: z.string().uuid().optional(),
  title: z.string().min(1),
  locale: z.enum(SIM_LOCALES).default('en'),
  status: z.enum(['draft', 'published']).default('draft'),
  persona: simPersonaSchema,
  channels: simChannelSchema.default({ phone: true, chat: true, email: true }),
  channel_config: z.record(z.unknown()).default({}),
  rubric: simRubricSchema,
  completion_rule: simCompletionRuleSchema.default({}),
  compliance: simComplianceSchema.default({}),
  persona_state_rules: z.record(z.unknown()).default({}),
  crm_skin: simCrmSkinSchema.optional(),
  source: z
    .object({
      type: z.enum(['manual', 'sop', 'transcript_import']).default('manual'),
      reference: z.string().optional(),
    })
    .default({ type: 'manual' }),
})

export const simPersonaStateSchema = z.object({
  mood: z.number().min(0).max(1),
  difficulty: z.number().min(0).max(1),
  trust: z.number().min(0).max(1),
})

export const simTranscriptTurnSchema = z.object({
  ts: z.string(),
  channel: z.enum(['phone', 'chat', 'email']),
  role: z.enum(['learner', 'customer', 'system']),
  text: z.string(),
  audio_ref: z.string().optional(),
})

export const simSessionSchema = z.object({
  id: z.string().uuid(),
  scenario_id: z.string().uuid(),
  user_id: z.string().uuid(),
  status: z.enum(['active', 'completed', 'abandoned']),
  persona_state: simPersonaStateSchema,
  active_channel: z.enum(['phone', 'chat', 'email']).default('phone'),
})

export const createSimSessionRequestSchema = z.object({
  scenario_id: z.string().uuid(),
  module_id: z.string().uuid().optional(),
  course_id: z.string().uuid().optional(),
  enrollment_id: z.string().uuid().optional(),
  preview: z.boolean().optional(),
})

export const simTurnRequestSchema = z.object({
  channel: z.enum(['phone', 'chat', 'email']),
  text: z.string().min(1),
})

export const simCrmActionRequestSchema = z.object({
  overlay_id: z.string().min(1),
  action: z.string().min(1),
  value: z.unknown().optional(),
})

export const simCoachEvaluateRequestSchema = z.object({
  session_id: z.string().uuid(),
  scenario: simScenarioSchema,
  transcript: z.array(simTranscriptTurnSchema),
  crm_actions: z.array(simCrmActionRequestSchema).default([]),
})

export const simCoachResultSchema = z.object({
  dimension_scores: z.record(z.number()),
  overall_score: z.number(),
  coach_narrative: z.string(),
  replay_moments: z.array(
    z.object({
      ts: z.string(),
      issue: z.string(),
      suggestion: z.string(),
    }),
  ),
  passed: z.boolean(),
})

export const generateScenarioRequestSchema = z.object({
  creator_user_id: z.string().uuid().optional(),
  title: z.string().optional(),
  content: z.string().min(20),
  locale: z.enum(SIM_LOCALES).default('en'),
})

export const fromTranscriptRequestSchema = z.object({
  creator_user_id: z.string().uuid().optional(),
  transcript: z.string().min(50),
  title: z.string().optional(),
  locale: z.enum(SIM_LOCALES).default('en'),
  focus_skills: z.array(z.string()).optional(),
})

export const personaTurnRequestSchema = z.object({
  session_id: z.string().uuid(),
  user_message: z.string().min(1),
  persona_state: simPersonaStateSchema,
  scenario_id: z.string().uuid().optional(),
  locale: z.string().default('en'),
  channel: z.enum(['phone', 'chat', 'email']).default('phone'),
  scenario_context: z
    .object({
      persona: simPersonaSchema.optional(),
      objectives: z.array(z.string()).optional(),
    })
    .optional(),
})

export const personaTurnResponseSchema = z.object({
  reply: z.string(),
  persona_state: simPersonaStateSchema,
  audio_hint: z.string().optional(),
})

export type SimScenario = z.infer<typeof simScenarioSchema>
export type SimCrmSkin = z.infer<typeof simCrmSkinSchema>
export type SimCoachResult = z.infer<typeof simCoachResultSchema>
export type SimPersonaState = z.infer<typeof simPersonaStateSchema>

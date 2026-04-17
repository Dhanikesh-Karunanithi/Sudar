// Learner performance data — institution-aware (KPIs, grades, custom)
// Used by org settings (performance_config) and learner_performance_records API

import { z } from 'zod'

// ---------------------------------------------------------------------------
// Organisation performance_config (stored in organisations.settings)
// ---------------------------------------------------------------------------

export const institutionTypeSchema = z.enum(['corporate', 'educational', 'other'])
export type InstitutionType = z.infer<typeof institutionTypeSchema>

export const kpiDefinitionSchema = z.object({
  id: z.string(),
  name: z.string(),
  unit: z.string().optional(),
  target: z.number().optional(),
  period: z.string().optional(), // e.g. 'monthly', 'quarterly'
})
export type KpiDefinition = z.infer<typeof kpiDefinitionSchema>

export const termDefinitionSchema = z.object({
  id: z.string(),
  name: z.string(),
  start: z.string(), // ISO date
  end: z.string(),
})
export type TermDefinition = z.infer<typeof termDefinitionSchema>

export const corporatePerformanceConfigSchema = z.object({
  kpis: z.array(kpiDefinitionSchema),
})
export type CorporatePerformanceConfig = z.infer<typeof corporatePerformanceConfigSchema>

export const educationalPerformanceConfigSchema = z.object({
  scale: z.enum(['percentage', 'letter', 'gpa']),
  terms: z.array(termDefinitionSchema).optional(),
})
export type EducationalPerformanceConfig = z.infer<typeof educationalPerformanceConfigSchema>

// Org settings.performance_config: institution_type + type-specific fields
export const performanceConfigSchema = z.object({
  institution_type: institutionTypeSchema,
  kpis: z.array(kpiDefinitionSchema).optional(),       // corporate
  scale: z.enum(['percentage', 'letter', 'gpa']).optional(),
  terms: z.array(termDefinitionSchema).optional(),      // educational
})
export type PerformanceConfig = z.infer<typeof performanceConfigSchema>

// ---------------------------------------------------------------------------
// Learner performance record (API payloads and DB row)
// ---------------------------------------------------------------------------

export const sourceTypeSchema = z.enum(['kpi', 'grade', 'custom'])
export type PerformanceSourceType = z.infer<typeof sourceTypeSchema>

export const learnerPerformanceRecordSchema = z.object({
  id: z.string().uuid().optional(),
  org_id: z.string().uuid(),
  user_id: z.string().uuid(),
  source_type: sourceTypeSchema,
  key: z.string().min(1),
  value: z.number(),
  value_display: z.string().nullable().optional(),
  period_start: z.string().optional().nullable(), // ISO date
  period_end: z.string().optional().nullable(),
  recorded_at: z.string().optional(),
  created_at: z.string().optional(),
})
export type LearnerPerformanceRecord = z.infer<typeof learnerPerformanceRecordSchema>

export const createPerformanceRecordSchema = learnerPerformanceRecordSchema.omit({
  id: true,
  recorded_at: true,
  created_at: true,
}).required({ org_id: true, user_id: true, source_type: true, key: true, value: true })
export type CreatePerformanceRecordInput = z.infer<typeof createPerformanceRecordSchema>

export const updatePerformanceRecordSchema = z.object({
  value: z.number().optional(),
  value_display: z.string().nullable().optional(),
  period_start: z.string().nullable().optional(),
  period_end: z.string().nullable().optional(),
})
export type UpdatePerformanceRecordInput = z.infer<typeof updatePerformanceRecordSchema>

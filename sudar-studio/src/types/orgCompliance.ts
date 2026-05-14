/**
 * Zod validation for organisations.settings.ai_compliance (PATCH body subset).
 * Stored as JSON; this schema rejects unknown keys on PATCH.
 */
import { z } from 'zod'

const retentionDaysNullable = z.number().int().positive().max(36500).nullable()

export const orgAiCompliancePatchSchema = z
  .object({
    allow_generative_personalization: z.boolean().optional(),
    require_learner_consent: z.boolean().optional(),
    personalization_data_retention_days: retentionDaysNullable.optional(),
    /** Documented intent for learning_events retention; enforcement may be added later. */
    learning_events_retention_days: retentionDaysNullable.optional(),
    /** Documented intent for ai_interactions retention; enforcement may be added later. */
    ai_interactions_retention_days: retentionDaysNullable.optional(),
    block_high_risk_pii_in_tutor: z.boolean().optional(),
    tutor_redact_echoed_secrets: z.boolean().optional(),
    tutor_output_moderation_strict: z.boolean().optional(),
    tutor_llm_memory_extraction_policy: z.enum(['learner_controlled', 'disabled_org_wide']).optional(),
    tutor_llm_memory_min_interval_hours: z.number().int().min(1).max(8760).nullable().optional(),
    memory_digest_min_interval_days_org: z.number().int().min(1).max(365).nullable().optional(),
  })
  .strict()

export type OrgAiCompliancePatch = z.infer<typeof orgAiCompliancePatchSchema>

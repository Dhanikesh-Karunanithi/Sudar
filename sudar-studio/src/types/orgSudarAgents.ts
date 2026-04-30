/**
 * PATCH body subset for organisations.settings.sudar_agents (merged with existing).
 */
import { z } from 'zod'

const featuresPatchSchema = z
  .object({
    cohort_pulse: z.boolean().optional(),
    learner_week_plan: z.boolean().optional(),
    spacing_nudges: z.boolean().optional(),
  })
  .strict()

export const orgSudarAgentsPatchSchema = z
  .object({
    enabled: z.boolean().optional(),
    features: featuresPatchSchema.optional(),
    policy_pack_id: z.string().trim().min(1).optional(),
    admin_explanation_level: z.enum(['simple', 'advanced']).optional(),
  })
  .strict()

export type OrgSudarAgentsPatch = z.infer<typeof orgSudarAgentsPatchSchema>

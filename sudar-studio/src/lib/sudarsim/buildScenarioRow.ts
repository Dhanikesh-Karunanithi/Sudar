import type { z } from 'zod'
import { simScenarioSchema } from '@shared-sudarsim/schemas'

type PartialScenario = z.infer<typeof simScenarioSchema.partial>

export function buildScenarioRow(
  data: PartialScenario,
  orgId: string,
  userId: string,
  publish = false,
) {
  return {
    org_id: orgId,
    created_by: userId,
    title: data.title ?? 'Simulation',
    locale: data.locale ?? 'en',
    status: publish ? 'published' : (data.status ?? 'draft'),
    persona: data.persona ?? {},
    channels: data.channels ?? {},
    channel_config: data.channel_config ?? {},
    rubric: data.rubric ?? {},
    completion_rule: data.completion_rule ?? {},
    compliance: data.compliance ?? {},
    persona_state_rules: data.persona_state_rules ?? {},
    source: data.source ?? { type: 'manual' as const },
    updated_at: new Date().toISOString(),
  }
}

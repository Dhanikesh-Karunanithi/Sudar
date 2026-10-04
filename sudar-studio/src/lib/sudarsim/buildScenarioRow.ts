import type { z } from 'zod'
import { simScenarioSchema } from '@shared-sudarsim/schemas'
import { defaultScenarioDraft } from '@/types/sudarsim'

type PartialScenario = z.infer<typeof simScenarioSchema.partial>

function isEmptyRecord(value: unknown): boolean {
  return !value || (typeof value === 'object' && !Array.isArray(value) && Object.keys(value as object).length === 0)
}

/** Merge API/DB partials with authoring defaults so empty jsonb never fails Zod on save. */
export function mergeScenarioDraft(data: PartialScenario = {}): PartialScenario {
  const defaults = defaultScenarioDraft(data.title ?? 'New simulation')
  const persona =
    isEmptyRecord(data.persona) || !(data.persona as { name?: string } | undefined)?.name?.trim()
      ? {
          ...defaults.persona,
          ...(typeof data.persona === 'object' && data.persona ? data.persona : {}),
          name:
            (data.persona as { name?: string } | undefined)?.name?.trim() ||
            defaults.persona!.name!,
        }
      : data.persona

  const rubric = isEmptyRecord(data.rubric) ? defaults.rubric : data.rubric
  const channels = isEmptyRecord(data.channels) ? defaults.channels : data.channels
  const completion_rule = isEmptyRecord(data.completion_rule)
    ? defaults.completion_rule
    : data.completion_rule
  const compliance = isEmptyRecord(data.compliance) ? defaults.compliance : data.compliance

  return {
    ...defaults,
    ...data,
    title: data.title?.trim() || defaults.title,
    locale: data.locale ?? defaults.locale,
    status: data.status ?? defaults.status,
    persona,
    channels,
    rubric,
    completion_rule,
    compliance,
    channel_config: data.channel_config ?? defaults.channel_config ?? {},
    persona_state_rules: data.persona_state_rules ?? defaults.persona_state_rules ?? {},
    source: data.source ?? defaults.source ?? { type: 'manual' as const },
  }
}

export function buildScenarioRow(
  data: PartialScenario,
  orgId: string,
  userId: string,
  publish = false,
) {
  const merged = mergeScenarioDraft(data)
  return {
    org_id: orgId,
    created_by: userId,
    title: merged.title ?? 'Simulation',
    locale: merged.locale ?? 'en',
    status: publish ? 'published' : (merged.status ?? 'draft'),
    persona: merged.persona ?? {},
    channels: merged.channels ?? {},
    channel_config: merged.channel_config ?? {},
    rubric: merged.rubric ?? {},
    completion_rule: merged.completion_rule ?? {},
    compliance: merged.compliance ?? {},
    persona_state_rules: merged.persona_state_rules ?? {},
    source: merged.source ?? { type: 'manual' as const },
    updated_at: new Date().toISOString(),
  }
}

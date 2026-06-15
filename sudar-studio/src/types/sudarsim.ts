import type { SimScenario, SimCrmSkin, SimRubricDimension } from '@shared-sudarsim/schemas'

export type { SimScenario, SimCrmSkin, SimRubricDimension }
export { SIM_LOCALES } from '@shared-sudarsim/schemas'

export const DEFAULT_RUBRIC_DIMENSIONS: SimRubricDimension[] = [
  { id: 'empathy', label: 'Empathy', description: 'Acknowledges customer feelings', weight: 0.25, must_pass: false },
  { id: 'compliance', label: 'Compliance', description: 'Follows required script and policy', weight: 0.25, must_pass: true },
  { id: 'resolution', label: 'Resolution', description: 'Moves toward a clear outcome', weight: 0.3, must_pass: true },
  { id: 'clarity', label: 'Clarity', description: 'Clear, professional communication', weight: 0.2, must_pass: false },
]

export function defaultScenarioDraft(title = 'New simulation'): Partial<SimScenario> {
  return {
    title,
    locale: 'en',
    status: 'draft',
    persona: {
      name: 'Customer',
      backstory: 'Needs help with a billing issue.',
      objectives: ['Verify identity', 'Resolve the issue', 'Confirm satisfaction'],
      initial_mood: 0.4,
      opening_line: 'Hi, I have been waiting on hold and I need help with my account.',
    },
    channels: { phone: true, chat: true, email: false },
    rubric: { dimensions: DEFAULT_RUBRIC_DIMENSIONS },
    completion_rule: { enabled: true, min_overall_score: 70, require_must_pass: true },
    compliance: { record_audio: false, record_transcript: true, retention_days: 90 },
  }
}

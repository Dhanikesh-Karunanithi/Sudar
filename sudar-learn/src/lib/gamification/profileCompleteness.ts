type TutorContext = Record<string, unknown>

function hasValue(value: unknown): boolean {
  if (value === null || value === undefined) return false
  if (typeof value === 'string') return value.trim().length > 0
  if (Array.isArray(value)) return value.length > 0
  if (typeof value === 'object') return Object.keys(value as Record<string, unknown>).length > 0
  return true
}

/**
 * Keep profile completeness deterministic so milestones are stable across APIs.
 */
export function computeProfileCompleteness(
  context: TutorContext,
  totalCheckinsAnswered: number,
  hasOrgContext: boolean
): number {
  let score = 0

  if (hasValue(context.learning_goals)) score += 10
  if (hasValue(context.self_reported_background)) score += 15
  if (hasValue(context.modality_preference)) score += 10
  if (hasValue(context.session_length_preference)) score += 5
  if (hasValue(context.preferred_explanation_style)) score += 10
  if (hasValue(context.role_context)) score += hasOrgContext ? 10 : 0
  if (hasValue(context.cognitive_style)) score += 10
  if (hasValue(context.difficulty_comfort)) score += 10
  if (hasValue(context.learning_style_notes)) score += 5

  // First 20 check-ins contribute up to 15%.
  const checkinContribution = Math.min(totalCheckinsAnswered, 20) / 20
  score += Math.round(checkinContribution * 15)

  return Math.max(0, Math.min(100, score))
}


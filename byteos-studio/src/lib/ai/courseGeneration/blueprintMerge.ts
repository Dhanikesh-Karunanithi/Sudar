import type {
  AiGenerationCourseSettings,
  BlueprintQuestionAnswer,
  CourseBlueprintQuestion,
} from './types'

/**
 * Merges selected blueprint options into settings fields for generation.
 * Later questions override earlier for scalar fields; forbidden types are unioned.
 */
export function mergeBlueprintAnswersIntoSettings(
  questions: CourseBlueprintQuestion[],
  answers: BlueprintQuestionAnswer[]
): Pick<
  AiGenerationCourseSettings,
  'blueprint_answers' | 'assessment_density' | 'interactivity_level' | 'primary_pedagogy' | 'forbidden_component_types'
> {
  const byQ = new Map(answers.map((a) => [a.question_id, a.option_id]))
  let assessment_density = undefined as AiGenerationCourseSettings['assessment_density']
  let interactivity_level = undefined as AiGenerationCourseSettings['interactivity_level']
  let primary_pedagogy = undefined as AiGenerationCourseSettings['primary_pedagogy']
  const forbidden = new Set<string>()

  for (const q of questions) {
    const oid = byQ.get(q.id)
    if (!oid) continue
    const opt = q.options.find((o) => o.id === oid)
    if (!opt) continue
    const e = opt.effect
    if (e.assessment_density) assessment_density = e.assessment_density
    if (e.interactivity_level) interactivity_level = e.interactivity_level
    if (e.primary_pedagogy) primary_pedagogy = e.primary_pedagogy
    for (const t of e.forbidden_component_types ?? []) {
      if (t.trim()) forbidden.add(t.trim())
    }
  }

  return {
    blueprint_answers: answers,
    ...(assessment_density ? { assessment_density } : {}),
    ...(interactivity_level ? { interactivity_level } : {}),
    ...(primary_pedagogy ? { primary_pedagogy } : {}),
    ...(forbidden.size > 0 ? { forbidden_component_types: [...forbidden] } : {}),
  }
}

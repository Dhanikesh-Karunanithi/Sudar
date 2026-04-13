import type { AiGenerationCourseSettings, BlueprintQuestionAnswer, GenerationTelemetry } from './types'

function parseBlueprintAnswers(raw: unknown): BlueprintQuestionAnswer[] | undefined {
  if (!Array.isArray(raw)) return undefined
  const out: BlueprintQuestionAnswer[] = []
  for (const x of raw) {
    if (!x || typeof x !== 'object') continue
    const q = x as Record<string, unknown>
    const qid = typeof q.question_id === 'string' ? q.question_id : ''
    const oid = typeof q.option_id === 'string' ? q.option_id : ''
    if (qid && oid) out.push({ question_id: qid, option_id: oid })
  }
  return out.length > 0 ? out : undefined
}

function parseForbiddenTypes(raw: unknown): string[] | undefined {
  if (!Array.isArray(raw)) return undefined
  const out = raw.filter((x): x is string => typeof x === 'string' && x.trim().length > 0).map((x) => x.trim())
  return out.length > 0 ? out : undefined
}

export function getAiGenerationSettings(raw: unknown): AiGenerationCourseSettings | undefined {
  if (!raw || typeof raw !== 'object') return undefined
  const s = raw as Record<string, unknown>
  const ag = s.ai_generation
  if (!ag || typeof ag !== 'object') return undefined
  const o = ag as Record<string, unknown>
  const outcomes = Array.isArray(o.learning_outcomes)
    ? o.learning_outcomes.filter((x): x is string => typeof x === 'string')
    : undefined
  const assessment = o.assessment_density
  const interactivity = o.interactivity_level
  const pedagogy = o.primary_pedagogy
  const telemetry = o.generation_telemetry
  let generation_telemetry: GenerationTelemetry | undefined
  if (telemetry && typeof telemetry === 'object') {
    const t = telemetry as Record<string, unknown>
    const completed = typeof t.completed_at === 'string' ? t.completed_at : ''
    const arch = Array.isArray(t.archetypes_used)
      ? t.archetypes_used.filter((x): x is string => typeof x === 'string')
      : []
    const comp = Array.isArray(t.component_types_used)
      ? t.component_types_used.filter((x): x is string => typeof x === 'string')
      : []
    const cp = typeof t.critique_passes === 'number' ? t.critique_passes : 0
    if (completed && arch.length >= 0) {
      generation_telemetry = {
        completed_at: completed,
        archetypes_used: arch,
        component_types_used: comp,
        critique_passes: cp,
      }
    }
  }

  return {
    target_audience: typeof o.target_audience === 'string' ? o.target_audience : undefined,
    learning_outcomes: outcomes && outcomes.length > 0 ? outcomes : undefined,
    tone: typeof o.tone === 'string' ? o.tone : undefined,
    industry: typeof o.industry === 'string' ? o.industry : undefined,
    no_external_video: o.no_external_video === true,
    document_text: typeof o.document_text === 'string' ? o.document_text : undefined,
    source: o.source === 'document' || o.source === 'prompt' ? o.source : undefined,
    blueprint_answers: parseBlueprintAnswers(o.blueprint_answers),
    assessment_density:
      assessment === 'light' || assessment === 'moderate' || assessment === 'heavy' ? assessment : undefined,
    interactivity_level:
      interactivity === 'low' || interactivity === 'balanced' || interactivity === 'high' ? interactivity : undefined,
    primary_pedagogy:
      pedagogy === 'declarative' || pedagogy === 'procedural' || pedagogy === 'scenario' || pedagogy === 'mixed'
        ? pedagogy
        : undefined,
    forbidden_component_types: parseForbiddenTypes(o.forbidden_component_types),
    generation_telemetry,
  }
}

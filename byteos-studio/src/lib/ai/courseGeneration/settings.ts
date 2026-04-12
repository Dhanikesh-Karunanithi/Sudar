import type { AiGenerationCourseSettings } from './types'

export function getAiGenerationSettings(raw: unknown): AiGenerationCourseSettings | undefined {
  if (!raw || typeof raw !== 'object') return undefined
  const s = raw as Record<string, unknown>
  const ag = s.ai_generation
  if (!ag || typeof ag !== 'object') return undefined
  const o = ag as Record<string, unknown>
  const outcomes = Array.isArray(o.learning_outcomes)
    ? o.learning_outcomes.filter((x): x is string => typeof x === 'string')
    : undefined
  return {
    target_audience: typeof o.target_audience === 'string' ? o.target_audience : undefined,
    learning_outcomes: outcomes && outcomes.length > 0 ? outcomes : undefined,
    tone: typeof o.tone === 'string' ? o.tone : undefined,
    industry: typeof o.industry === 'string' ? o.industry : undefined,
    no_external_video: o.no_external_video === true,
    document_text: typeof o.document_text === 'string' ? o.document_text : undefined,
    source: o.source === 'document' || o.source === 'prompt' ? o.source : undefined,
  }
}

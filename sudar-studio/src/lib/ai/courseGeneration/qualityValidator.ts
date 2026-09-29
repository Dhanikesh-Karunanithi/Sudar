/**
 * Sudar Studio — LLM-as-judge for generated modules.
 * Judges the FULL module (chunked), validates the judge output with Zod, and reports failure
 * explicitly instead of inventing a neutral score.
 */

import {
  RUBRIC_DESCRIPTIONS,
  RUBRIC_DIMENSIONS,
  chunkForJudge,
  combineJudgeOutputs,
  parseJudgeOutput,
  type JudgeOutput,
  type QualityAssessment,
} from '@shared-content-generation/quality'
import { chatCompletion, type ChatCompletionContext } from '@/lib/ai/chat'

export interface QualityValidationInput {
  moduleTitle: string
  moduleContent: string
  courseContext?: string
  learningOutcomes?: string[]
  bloomLevel?: string
  /** Present when the course is grounded in a source document; the judge checks faithfulness. */
  groundingExcerpt?: string
}

export function buildJudgePrompt(
  input: QualityValidationInput,
  chunk: string,
  part: { index: number; total: number },
): { role: 'system' | 'user'; content: string }[] {
  const rubric = RUBRIC_DIMENSIONS.map((d) => `- ${d}: ${RUBRIC_DESCRIPTIONS[d]}`).join('\n')
  const system = `You are a strict learning-science reviewer (Merrill's First Principles, retrieval practice, worked-example effect, cognitive load theory, Bloom's revised taxonomy).
Score the module content on each dimension from 1 (poor) to 10 (excellent). Be critical: 7 means "good enough to ship to paying learners"; reserve 9–10 for exemplary work.

Rubric:
${rubric}

Report concrete issues. Use severity "critical" ONLY for: factual errors, invented statistics/citations, unsafe advice, content that contradicts the source excerpt, or content unrelated to the module title. Use "warning" for pedagogy gaps and "info" for polish.

Return ONLY JSON:
{"scores":{${RUBRIC_DIMENSIONS.map((d) => `"${d}":n`).join(',')}},"issues":[{"dimension":"<rubric key>","severity":"info|warning|critical","description":"...","suggestion":"...","quote":"short excerpt"}],"summary":"one sentence"}`

  const user = `Module: "${input.moduleTitle}"${input.bloomLevel ? `\nTarget Bloom level: ${input.bloomLevel}` : ''}
${input.courseContext ? `Course: ${input.courseContext}` : ''}
${input.learningOutcomes?.length ? `Learning outcomes:\n${input.learningOutcomes.map((o, i) => `${i + 1}. ${o}`).join('\n')}` : ''}
${input.groundingExcerpt ? `\n--- SOURCE EXCERPT (content must be faithful to this) ---\n${input.groundingExcerpt.slice(0, 6000)}\n--- END SOURCE ---` : ''}
${part.total > 1 ? `\nThis is part ${part.index + 1} of ${part.total} of the module; judge only what you see but consider it a section of a longer lesson.` : ''}

--- CONTENT TO REVIEW ---
${chunk}`

  return [
    { role: 'system', content: system },
    { role: 'user', content: user },
  ]
}

export async function validateContentQuality(
  input: QualityValidationInput,
  ctx?: ChatCompletionContext,
): Promise<QualityAssessment> {
  const chunks = chunkForJudge(input.moduleContent)
  const judgedChars = chunks.reduce((n, c) => n + c.length, 0)
  const outputs: JudgeOutput[] = []
  let lastError: string | undefined

  for (let i = 0; i < chunks.length; i++) {
    const messages = buildJudgePrompt(input, chunks[i]!, { index: i, total: chunks.length })
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const { content } = await chatCompletion({ messages, max_tokens: 1400, temperature: 0.1 }, ctx)
        const parsed = parseJudgeOutput(content)
        if (parsed) {
          outputs.push(parsed)
          break
        }
        lastError = 'Judge returned invalid JSON'
      } catch (err) {
        lastError = err instanceof Error ? err.message : 'Judge call failed'
      }
    }
  }

  if (outputs.length < chunks.length) {
    return {
      ok: false,
      overall: null,
      scores: {},
      issues: [
        {
          dimension: 'clarity',
          severity: 'warning',
          description: `Automated review could not assess ${chunks.length - outputs.length} of ${chunks.length} part(s); a human should review this module.`,
        },
      ],
      judged_chars: judgedChars,
      error: lastError,
    }
  }
  return combineJudgeOutputs(outputs, judgedChars)
}

export function getQualityInterpretation(score: number | null): string {
  if (score === null) return 'Not assessed — review manually'
  if (score >= 9) return 'Excellent — production ready'
  if (score >= 8) return 'Good — minor revisions may help'
  if (score >= 7) return 'Acceptable — consider improvements'
  if (score >= 5) return 'Needs work — significant revision required'
  return 'Poor — regenerate'
}

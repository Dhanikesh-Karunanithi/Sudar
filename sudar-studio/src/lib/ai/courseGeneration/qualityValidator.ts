/**
 * Sudar Studio — LLM-as-judge for generated modules.
 * Judges the FULL module (chunked), validates the judge output with Zod, and reports failure
 * explicitly instead of inventing a neutral score.
 */

import {
  buildJudgeMessages,
  chunkForJudge,
  combineJudgeOutputs,
  parseJudgeOutput,
  type JudgeInput,
  type JudgeOutput,
  type QualityAssessment,
} from '@shared-content-generation/quality'
import { chatCompletion, type ChatCompletionContext } from '@/lib/ai/chat'

export interface QualityValidationInput extends JudgeInput {
  moduleContent: string
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
    const messages = buildJudgeMessages(input, chunks[i]!, { index: i, total: chunks.length })
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

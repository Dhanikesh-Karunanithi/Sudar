/**
 * Golden-set evaluation for the content quality gate (scripts/evals/golden/content-golden.json).
 * Deterministic checks always run in CI. The LLM judge calibration runs only with EVAL_JUDGE=1
 * and TOGETHER_API_KEY / OPENROUTER_API_KEY / OPENAI_API_KEY set (`npm run eval:content`).
 */
import { readFileSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import {
  buildJudgeMessages,
  parseJudgeOutput,
  runDeterministicChecks,
  validateQuizQuality,
  verifyCitations,
  weightedOverall,
} from '@shared-content-generation/quality'

interface GoldenModule {
  id: string
  title: string
  bloomLevel?: string
  learningOutcomes?: string[]
  sources?: number[]
  markdown: string
  expect: {
    deterministic: { maxWarnings?: number; mustFlag?: string[]; citationsOk?: boolean }
    judge?: { minOverall?: number; maxOverall?: number }
  }
}

interface GoldenQuiz {
  id: string
  objectives: string[]
  questions: { question: string; options: string[]; correct: number }[]
  expect: { maxCritical?: number; minCritical?: number; mustFlag?: string[] }
}

const golden = JSON.parse(
  readFileSync(path.resolve(__dirname, '../../../../../scripts/evals/golden/content-golden.json'), 'utf8'),
) as { modules: GoldenModule[]; quizzes: GoldenQuiz[] }

describe('content golden set — deterministic', () => {
  for (const mod of golden.modules) {
    it(`${mod.id}`, () => {
      const issues = runDeterministicChecks(mod.markdown)
      const exp = mod.expect.deterministic
      if (exp.maxWarnings != null) {
        expect(issues.filter((i) => i.severity !== 'info').map((i) => i.description)).toHaveLength(exp.maxWarnings)
      }
      for (const dim of exp.mustFlag ?? []) {
        const citationFlag = dim === 'accuracy_risk' && !verifyCitations(mod.markdown, mod.sources ?? []).ok
        expect(issues.some((i) => i.dimension === dim) || citationFlag, `${mod.id} should flag ${dim}`).toBe(true)
      }
      if (exp.citationsOk != null) {
        expect(verifyCitations(mod.markdown, mod.sources ?? []).ok).toBe(exp.citationsOk)
      }
    })
  }

  for (const quiz of golden.quizzes) {
    it(`${quiz.id}`, () => {
      const issues = validateQuizQuality(quiz.questions, { objectives: quiz.objectives })
      const critical = issues.filter((i) => i.severity === 'critical').length
      if (quiz.expect.maxCritical != null) expect(critical).toBeLessThanOrEqual(quiz.expect.maxCritical)
      if (quiz.expect.minCritical != null) expect(critical).toBeGreaterThanOrEqual(quiz.expect.minCritical)
      for (const dim of quiz.expect.mustFlag ?? []) expect(issues.some((i) => i.dimension === dim)).toBe(true)
    })
  }
})

function judgeProvider(): { url: string; key: string; model: string } | null {
  if (process.env.TOGETHER_API_KEY) {
    return {
      url: 'https://api.together.xyz/v1/chat/completions',
      key: process.env.TOGETHER_API_KEY,
      model: process.env.EVAL_JUDGE_MODEL || 'meta-llama/Llama-3.3-70B-Instruct-Turbo',
    }
  }
  if (process.env.OPENROUTER_API_KEY) {
    return {
      url: 'https://openrouter.ai/api/v1/chat/completions',
      key: process.env.OPENROUTER_API_KEY,
      model: process.env.EVAL_JUDGE_MODEL || 'openai/gpt-4o-mini',
    }
  }
  if (process.env.OPENAI_API_KEY) {
    return {
      url: 'https://api.openai.com/v1/chat/completions',
      key: process.env.OPENAI_API_KEY,
      model: process.env.EVAL_JUDGE_MODEL || 'gpt-4o-mini',
    }
  }
  return null
}

const provider = process.env.EVAL_JUDGE === '1' ? judgeProvider() : null

describe.skipIf(!provider)('content golden set — LLM judge calibration', () => {
  for (const mod of golden.modules.filter((m) => m.expect.judge)) {
    it(
      `${mod.id}`,
      async () => {
        const res = await fetch(provider!.url, {
          method: 'POST',
          headers: { Authorization: `Bearer ${provider!.key}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model: provider!.model,
            temperature: 0.1,
            max_tokens: 1400,
            messages: buildJudgeMessages(
              { moduleTitle: mod.title, learningOutcomes: mod.learningOutcomes, bloomLevel: mod.bloomLevel },
              mod.markdown,
            ),
          }),
        })
        expect(res.ok).toBe(true)
        const json = (await res.json()) as { choices?: { message?: { content?: string } }[] }
        const parsed = parseJudgeOutput(json.choices?.[0]?.message?.content ?? '')
        expect(parsed, 'judge must return a valid rubric response').not.toBeNull()
        const overall = weightedOverall(parsed!.scores)!
        const { minOverall, maxOverall } = mod.expect.judge!
        if (minOverall != null) expect(overall).toBeGreaterThanOrEqual(minOverall)
        if (maxOverall != null) expect(overall).toBeLessThanOrEqual(maxOverall)
      },
      60_000,
    )
  }
})

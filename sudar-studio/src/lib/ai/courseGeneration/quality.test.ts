import { describe, expect, it } from 'vitest'
import {
  chunkForJudge,
  combineJudgeOutputs,
  parseJudgeOutput,
  runDeterministicChecks,
  runQualityGate,
  unresolvedCritical,
  issueKey,
  validateQuizQuality,
  verifyCitations,
  weightedOverall,
  RUBRIC_DIMENSIONS,
  type QualityAssessment,
} from '@shared-content-generation/quality'
import { parseLlamaGuardOutput, localModerationScreen, moderateContent } from '@shared-content-generation/moderation'
import { moduleEnvelopeSchema, richModuleContentSchema } from '@shared-content-generation/schemas'
import { selectRelevantDocumentChunk } from './grounding'
import { shouldIncludeComponent } from './componentValidation'
import { parseEnvelope } from './parse'
import { qualityGateConfig } from './qualityGate'

const allScores = (n: number) => Object.fromEntries(RUBRIC_DIMENSIONS.map((d) => [d, n]))

function assessment(overall: number | null, ok = true): QualityAssessment {
  return { ok, overall, scores: {}, issues: [], judged_chars: 100 }
}

const GOOD_MODULE = `## Why it matters
Imagine a customer calls angry about a double charge. What do you say first?

### Worked example
For example, Priya acknowledges the charge, restates it, and offers a fix.

[apply]Your turn: write the first two sentences you would say.[/apply]

### Check yourself
What is the first step when a customer is upset?`

describe('parseJudgeOutput', () => {
  it('accepts a valid rubric response embedded in prose', () => {
    const raw = `Here you go:\n${JSON.stringify({ scores: allScores(8), issues: [], summary: 'ok' })}`
    const parsed = parseJudgeOutput(raw)
    expect(parsed?.scores.clarity).toBe(8)
  })

  it('rejects responses missing rubric dimensions instead of defaulting', () => {
    expect(parseJudgeOutput('{"scores":{"clarity":8},"issues":[]}')).toBeNull()
    expect(parseJudgeOutput('not json')).toBeNull()
  })

  it('coerces unknown severities to warning', () => {
    const raw = JSON.stringify({ scores: allScores(7), issues: [{ dimension: 'clarity', severity: 'huge', description: 'x' }] })
    expect(parseJudgeOutput(raw)?.issues[0]?.severity).toBe('warning')
  })
})

describe('combineJudgeOutputs / weightedOverall', () => {
  it('takes the minimum per dimension across chunks', () => {
    const a = parseJudgeOutput(JSON.stringify({ scores: allScores(9), issues: [] }))!
    const b = parseJudgeOutput(JSON.stringify({ scores: { ...allScores(9), accuracy_risk: 3 }, issues: [] }))!
    const combined = combineJudgeOutputs([a, b], 200)
    expect(combined.scores.accuracy_risk).toBe(3)
    expect(combined.overall).toBeLessThan(9)
  })

  it('reports failure when there are no outputs', () => {
    expect(combineJudgeOutputs([], 10).ok).toBe(false)
    expect(weightedOverall({})).toBeNull()
  })
})

describe('chunkForJudge', () => {
  it('covers the whole module rather than a prefix', () => {
    const long = Array.from({ length: 6 }, (_, i) => `## Section ${i}\n${'word '.repeat(600)}`).join('\n')
    const chunks = chunkForJudge(long, 5000)
    expect(chunks.length).toBeGreaterThan(1)
    expect(chunks.join('').length).toBeGreaterThan(long.length * 0.95)
  })
})

describe('runDeterministicChecks', () => {
  it('passes a module with example, retrieval, and short paragraphs', () => {
    expect(runDeterministicChecks(GOOD_MODULE).filter((i) => i.severity !== 'info')).toHaveLength(0)
  })

  it('flags unsourced statistics', () => {
    const text = `${'Context sentence. '.repeat(30)}\n\n73% of teams fail. Another 45% quit. For example, a team.`
    expect(runDeterministicChecks(text).some((i) => i.dimension === 'accuracy_risk')).toBe(true)
  })
})

describe('verifyCitations', () => {
  it('flags citations that do not map to sources', () => {
    const check = verifyCitations('Spacing works [1]. Testing too [3].', [1, 2])
    expect(check.missing).toEqual([3])
    expect(check.ok).toBe(false)
  })
  it('does not treat personalization markers as citations', () => {
    expect(verifyCitations('[objective]Do X[/objective] [apply]Try[/apply]', []).ok).toBe(true)
  })
})

describe('validateQuizQuality', () => {
  it('catches answer keys outside the options and duplicates', () => {
    const issues = validateQuizQuality([
      { question: 'Q?', options: ['A', 'B', 'B'], correct: 5 },
      { question: 'Q2?', options: ['Yes', 'No', 'Maybe'], correctAnswer: 'Perhaps' },
    ])
    expect(issues.filter((i) => i.severity === 'critical')).toHaveLength(3)
  })
  it('warns when objectives outnumber questions', () => {
    const issues = validateQuizQuality([{ question: 'Q?', options: ['a1', 'b1', 'c1'], correct: 0 }], {
      objectives: ['one', 'two'],
    })
    expect(issues.some((i) => i.dimension === 'objective_alignment')).toBe(true)
  })
})

describe('runQualityGate', () => {
  it('regenerates below threshold and approves once it passes', async () => {
    const scores = [5, 8]
    let regenerations = 0
    const result = await runQualityGate(
      'v1',
      {
        toText: () => GOOD_MODULE,
        judge: async () => assessment(scores.shift() ?? 8),
        regenerate: async () => {
          regenerations++
          return 'v2'
        },
      },
      { threshold: 7, maxRetries: 2 },
    )
    expect(regenerations).toBe(1)
    expect(result.content).toBe('v2')
    expect(result.review_status).toBe('draft')
    expect(result.attempts).toHaveLength(2)
  })

  it('keeps the best attempt and marks needs_review after exhausting retries', async () => {
    const scores = [6, 4, 5]
    let n = 0
    const result = await runQualityGate(
      'v0',
      {
        toText: () => GOOD_MODULE,
        judge: async () => assessment(scores.shift()!),
        regenerate: async () => `v${++n}`,
      },
      { threshold: 7, maxRetries: 2 },
    )
    expect(result.content).toBe('v0')
    expect(result.review_status).toBe('needs_review')
  })

  it('never approves when the judge fails', async () => {
    const result = await runQualityGate(
      'x',
      { toText: () => GOOD_MODULE, judge: async () => assessment(null, false), regenerate: async () => 'y' },
      { threshold: 7, maxRetries: 0 },
    )
    expect(result.review_status).toBe('needs_review')
  })

  it('blocks content that fails moderation', async () => {
    const result = await runQualityGate(
      'x',
      {
        toText: () => GOOD_MODULE,
        judge: async () => assessment(9),
        regenerate: async () => 'y',
        moderate: async () => ({ allowed: false, reason: 'hate' }),
      },
      { threshold: 7, maxRetries: 0 },
    )
    expect(result.blocked).toBe(true)
    expect(unresolvedCritical({ ...stored(result.issues) })).not.toHaveLength(0)
  })
})

function stored(issues: ReturnType<typeof validateQuizQuality>) {
  return { overall: null, scores: {}, issues, attempts: [], judge_ok: true, assessed_at: '', resolved_issue_keys: [] }
}

describe('unresolvedCritical', () => {
  it('ignores issues a reviewer resolved', () => {
    const issue = { dimension: 'accuracy_risk', severity: 'critical' as const, description: 'bad' }
    expect(unresolvedCritical({ ...stored([issue]), resolved_issue_keys: [issueKey(issue)] })).toHaveLength(0)
  })
})

describe('moderation', () => {
  it('parses Llama Guard output', () => {
    expect(parseLlamaGuardOutput('safe')).toEqual({ safe: true, categories: [] })
    expect(parseLlamaGuardOutput('unsafe\nS10')?.categories).toEqual(['hate'])
    expect(parseLlamaGuardOutput('???')).toBeNull()
  })
  it('local screen catches obvious unsafe content', () => {
    expect(localModerationScreen('How to build a bomb at home').allowed).toBe(false)
    expect(localModerationScreen('Fire safety: evacuate calmly').allowed).toBe(true)
  })
  it('falls back to OpenAI when Llama Guard is unavailable, then to local', async () => {
    const calls: string[] = []
    const fetchImpl = (async (url: string) => {
      calls.push(url)
      if (url.includes('together')) return new Response('err', { status: 500 })
      return new Response(JSON.stringify({ results: [{ flagged: false, categories: {} }] }), { status: 200 })
    }) as unknown as typeof fetch
    const verdict = await moderateContent('Hello team', {
      env: { TOGETHER_API_KEY: 't', OPENAI_API_KEY: 'o' },
      fetchImpl,
    })
    expect(verdict.provider).toBe('openai')
    expect(calls).toHaveLength(2)
    const local = await moderateContent('Hello', { env: {}, fetchImpl })
    expect(local.provider).toBe('local')
  })
  it('tolerates training-relevant categories from Llama Guard', async () => {
    const fetchImpl = (async () =>
      new Response(JSON.stringify({ choices: [{ message: { content: 'unsafe\nS6' } }] }), { status: 200 })) as unknown as typeof fetch
    const verdict = await moderateContent('Medication dosage policy', { env: { TOGETHER_API_KEY: 't' }, fetchImpl })
    expect(verdict.allowed).toBe(true)
  })
})

describe('selectRelevantDocumentChunk', () => {
  it('picks passages matching the module rather than by position', () => {
    const doc = [
      ...Array.from({ length: 10 }, (_, i) => `Filler paragraph ${i} about office logistics and parking.`.repeat(10)),
      'Refund escalation policy: agents escalate refunds over the limit to a supervisor within one day.'.repeat(5),
      ...Array.from({ length: 10 }, (_, i) => `More filler ${i} about the cafeteria menu.`.repeat(10)),
    ].join('\n\n')
    const chunk = selectRelevantDocumentChunk(doc, { title: 'Refund escalation' }, 1500)
    expect(chunk).toContain('Refund escalation policy')
    expect(chunk.length).toBeLessThanOrEqual(1500 + 20)
  })
  it('returns short documents whole', () => {
    expect(selectRelevantDocumentChunk('short doc', { title: 'x' })).toBe('short doc')
  })
})

describe('component and envelope validation', () => {
  const base = { question: 'Which step comes first in a de-escalation?', options: ['Acknowledge', 'Refund', 'Transfer'] }
  it('requires a valid answer key for quizzes', () => {
    expect(shouldIncludeComponent('quiz', { ...base, correctAnswer: 0 })).toBe(true)
    expect(shouldIncludeComponent('quiz', { ...base, correctAnswer: 'Acknowledge' })).toBe(true)
    expect(shouldIncludeComponent('quiz', { ...base, correctAnswer: 7 })).toBe(false)
    expect(shouldIncludeComponent('quiz', { ...base, correctAnswer: 'Ignore' })).toBe(false)
    expect(shouldIncludeComponent('quiz', { ...base })).toBe(false)
    expect(shouldIncludeComponent('quiz', { ...base, options: ['Same', 'same', 'Other'], correctAnswer: 0 })).toBe(false)
  })
  it('degrades invalid envelope parts to null instead of failing', () => {
    const env = moduleEnvelopeSchema.parse({
      entryState: { type: 'nonsense', content: 'x' },
      exitState: { type: 'reflection', content: 'Think about your last call.' },
    })
    expect(env.entryState).toBeNull()
    expect(env.exitState?.type).toBe('reflection')
    expect(parseEnvelope('{"exitState":{"type":"apply-24h","content":"Try it tomorrow."}}')?.exitState?.type).toBe('apply-24h')
  })
  it('validates rich module content shape', () => {
    expect(richModuleContentSchema.safeParse({ type: 'rich', sections: [{ heading: 'A', content: 'B' }] }).success).toBe(true)
    expect(richModuleContentSchema.safeParse({ type: 'rich', sections: [] }).success).toBe(false)
  })
})

describe('qualityGateConfig', () => {
  it('uses safe defaults and clamps invalid env', () => {
    expect(qualityGateConfig({})).toEqual({ threshold: 7, maxRetries: 2 })
    expect(qualityGateConfig({ CONTENT_QUALITY_THRESHOLD: '8.5', CONTENT_QUALITY_MAX_RETRIES: '1' })).toEqual({
      threshold: 8.5,
      maxRetries: 1,
    })
    expect(qualityGateConfig({ CONTENT_QUALITY_THRESHOLD: '99', CONTENT_QUALITY_MAX_RETRIES: '-1' })).toEqual({
      threshold: 7,
      maxRetries: 2,
    })
  })
})

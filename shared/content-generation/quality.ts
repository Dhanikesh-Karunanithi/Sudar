/**
 * Content quality contract shared by Studio generation, Learn generators, MCP, and evals.
 * Pure functions only (no network, no DB) so every gate decision is unit-testable.
 */
import { z } from 'zod'

// ---------------------------------------------------------------------------
// Rubric
// ---------------------------------------------------------------------------

/**
 * Evidence-based rubric dimensions (1–10). `accuracy_risk` is scored so that 10 = very low risk,
 * keeping "higher is better" for every dimension.
 */
export const RUBRIC_DIMENSIONS = [
  'objective_alignment',
  'bloom_fit',
  'retrieval_practice',
  'worked_examples',
  'cognitive_load',
  'accuracy_risk',
  'interactivity',
  'clarity',
  'engagement',
] as const
export type RubricDimension = (typeof RUBRIC_DIMENSIONS)[number]

/** Weights reflect how strongly each dimension predicts learning outcomes; accuracy is non-negotiable. */
export const RUBRIC_WEIGHTS: Record<RubricDimension, number> = {
  objective_alignment: 1.5,
  bloom_fit: 1,
  retrieval_practice: 1.25,
  worked_examples: 1,
  cognitive_load: 1,
  accuracy_risk: 2,
  interactivity: 0.75,
  clarity: 1,
  engagement: 0.75,
}

export const RUBRIC_DESCRIPTIONS: Record<RubricDimension, string> = {
  objective_alignment: 'Every section serves the stated learning objectives; nothing off-topic.',
  bloom_fit: 'Cognitive demand matches the target Bloom level (e.g. Apply = learner does something, not just reads).',
  retrieval_practice: 'Learner is asked to recall or apply at least once (question, prompt, "your turn"), not only reread.',
  worked_examples: 'A concrete worked example is shown step by step before the learner practises; later practice is less guided.',
  cognitive_load: 'Chunked into short sections, one idea at a time, no walls of text, jargon defined on first use.',
  accuracy_risk: '10 = claims are standard, well-established, or sourced; low = specific statistics, names, dates, or claims likely to be wrong or invented.',
  interactivity: 'Includes meaningful practice or reflection beyond prose.',
  clarity: 'Plain language, concrete, unambiguous.',
  engagement: 'Opens with a hook tied to the learner\'s work; uses scenarios or stories.',
}

export const qualityIssueSchema = z.object({
  dimension: z.string().default('clarity'),
  severity: z.enum(['info', 'warning', 'critical']).catch('warning'),
  description: z.string().min(1),
  suggestion: z.string().optional(),
  quote: z.string().max(400).optional(),
})
export type QualityIssue = z.infer<typeof qualityIssueSchema>

const score = z.coerce.number().min(1).max(10)

export const judgeOutputSchema = z.object({
  scores: z.object(
    Object.fromEntries(RUBRIC_DIMENSIONS.map((d) => [d, score])) as Record<RubricDimension, typeof score>,
  ),
  issues: z.array(qualityIssueSchema).max(30).default([]),
  summary: z.string().optional(),
})
export type JudgeOutput = z.infer<typeof judgeOutputSchema>

export interface QualityAssessment {
  /** False when the judge could not produce a valid assessment (never silently scored). */
  ok: boolean
  overall: number | null
  scores: Partial<Record<RubricDimension, number>>
  issues: QualityIssue[]
  judged_chars: number
  error?: string
}

/** Extract and validate the judge's JSON. Returns null when it is not a valid rubric response. */
export function parseJudgeOutput(raw: string): JudgeOutput | null {
  const match = raw.match(/\{[\s\S]*\}/)
  if (!match) return null
  const candidates = [match[0], match[0].replace(/,\s*([}\]])/g, '$1')]
  for (const candidate of candidates) {
    try {
      const parsed = judgeOutputSchema.safeParse(JSON.parse(candidate))
      if (parsed.success) return parsed.data
    } catch {
      // try next candidate
    }
  }
  return null
}

export function weightedOverall(scores: Partial<Record<RubricDimension, number>>): number | null {
  let sum = 0
  let weight = 0
  for (const d of RUBRIC_DIMENSIONS) {
    const s = scores[d]
    if (typeof s !== 'number' || Number.isNaN(s)) continue
    sum += s * RUBRIC_WEIGHTS[d]
    weight += RUBRIC_WEIGHTS[d]
  }
  if (weight === 0) return null
  return Math.round((sum / weight) * 10) / 10
}

/**
 * Combine per-chunk judge results. Uses the minimum per dimension so a weak section
 * can't be averaged away by strong ones.
 */
export function combineJudgeOutputs(outputs: JudgeOutput[], judgedChars: number): QualityAssessment {
  if (outputs.length === 0) {
    return { ok: false, overall: null, scores: {}, issues: [], judged_chars: judgedChars, error: 'No valid judge output' }
  }
  const scores: Partial<Record<RubricDimension, number>> = {}
  for (const d of RUBRIC_DIMENSIONS) {
    scores[d] = Math.min(...outputs.map((o) => o.scores[d]))
  }
  const seen = new Set<string>()
  const issues: QualityIssue[] = []
  for (const o of outputs) {
    for (const issue of o.issues) {
      const key = `${issue.dimension}:${issue.description.toLowerCase().slice(0, 80)}`
      if (seen.has(key)) continue
      seen.add(key)
      issues.push(issue)
    }
  }
  return { ok: true, overall: weightedOverall(scores), scores, issues, judged_chars: judgedChars }
}

/** Split long content on section boundaries so the judge sees everything, not a prefix. */
export function chunkForJudge(content: string, targetChars = 9000, maxChunks = 4): string[] {
  const text = content.trim()
  // Grow chunks rather than drop the tail when a module is longer than maxChunks * targetChars.
  const maxChars = Math.max(targetChars, Math.ceil(text.length / maxChunks))
  if (text.length <= maxChars) return [text]
  const sections = text.split(/\n(?=##\s)/)
  const chunks: string[] = []
  let current = ''
  for (const section of sections) {
    if (current && current.length + section.length > maxChars) {
      chunks.push(current)
      current = ''
    }
    current = current ? `${current}\n${section}` : section
    while (current.length > maxChars) {
      chunks.push(current.slice(0, maxChars))
      current = current.slice(maxChars)
    }
  }
  if (current.trim()) chunks.push(current)
  if (chunks.length <= maxChunks) return chunks
  const perGroup = Math.ceil(chunks.length / maxChunks)
  const merged: string[] = []
  for (let i = 0; i < chunks.length; i += perGroup) merged.push(chunks.slice(i, i + perGroup).join('\n'))
  return merged
}

// ---------------------------------------------------------------------------
// Deterministic checks (no LLM)
// ---------------------------------------------------------------------------

export function runDeterministicChecks(markdown: string, opts: { requireRetrieval?: boolean } = {}): QualityIssue[] {
  const issues: QualityIssue[] = []
  const text = markdown.trim()
  const words = text.split(/\s+/).filter(Boolean).length

  const hasExample = /(for example|for instance|e\.g\.|worked example|case study|scenario|imagine|suppose)/i.test(text)
  if (!hasExample && words > 250) {
    issues.push({
      dimension: 'worked_examples',
      severity: 'warning',
      description: 'No concrete example or scenario found.',
      suggestion: 'Add a step-by-step worked example before asking the learner to practise.',
    })
  }

  const hasRetrieval =
    /\?\s*$/m.test(text) || /\[apply\]|your turn|try this|now you try|practice|reflect|pause and/i.test(text)
  if ((opts.requireRetrieval ?? true) && !hasRetrieval && words > 200) {
    issues.push({
      dimension: 'retrieval_practice',
      severity: 'warning',
      description: 'The module never asks the learner to recall or apply anything.',
      suggestion: 'Add a "your turn" prompt or question that requires recall or application.',
    })
  }

  const paragraphs = text.split(/\n\s*\n/)
  const wall = paragraphs.find((p) => !p.trim().startsWith('|') && p.split(/\s+/).length > 180)
  if (wall) {
    issues.push({
      dimension: 'cognitive_load',
      severity: 'warning',
      description: 'A paragraph exceeds 180 words (wall of text).',
      suggestion: 'Split into shorter paragraphs, a list, or a table.',
      quote: wall.slice(0, 160),
    })
  }

  if (/^(in this (module|section|course)|let'?s explore|it is important to note|welcome to)/im.test(text)) {
    issues.push({
      dimension: 'engagement',
      severity: 'info',
      description: 'Generic opening phrase.',
      suggestion: 'Open with a concrete scenario, question, or surprising claim.',
    })
  }

  const statistics = text.match(/\b\d{1,3}(\.\d+)?\s?%|\b(19|20)\d{2}\b study|according to (a|one) (study|survey|report)/gi) ?? []
  const hasCitation = /\[\d+\]/.test(text)
  if (statistics.length >= 2 && !hasCitation) {
    issues.push({
      dimension: 'accuracy_risk',
      severity: 'warning',
      description: `${statistics.length} statistics or study claims appear without sources.`,
      suggestion: 'Cite a source for each statistic or remove it.',
      quote: statistics.slice(0, 3).join('; '),
    })
  }

  return issues
}

// ---------------------------------------------------------------------------
// Citations
// ---------------------------------------------------------------------------

export interface CitationCheck {
  cited: number[]
  missing: number[]
  unused: number[]
  ok: boolean
}

/** Every `[N]` in the text must refer to one of the provided source ids. */
export function verifyCitations(markdown: string, sourceIds: number[]): CitationCheck {
  const cited = [...new Set([...markdown.matchAll(/\[(\d{1,3})\]/g)].map((m) => Number(m[1])))].sort((a, b) => a - b)
  const available = new Set(sourceIds)
  const missing = cited.filter((n) => !available.has(n))
  const unused = sourceIds.filter((n) => !cited.includes(n))
  return { cited, missing, unused, ok: missing.length === 0 }
}

export function citationIssues(check: CitationCheck): QualityIssue[] {
  if (check.ok) return []
  return [
    {
      dimension: 'accuracy_risk',
      severity: 'critical',
      description: `Citation(s) ${check.missing.map((n) => `[${n}]`).join(', ')} do not match any provided source.`,
      suggestion: 'Remove the fabricated citation or replace it with a real source from the list.',
    },
  ]
}

// ---------------------------------------------------------------------------
// Assessments
// ---------------------------------------------------------------------------

export interface QuizLikeQuestion {
  question: string
  options: string[]
  correct?: number
  correctAnswer?: string
}

export function validateQuizQuality(
  questions: QuizLikeQuestion[],
  opts: { objectives?: string[] } = {},
): QualityIssue[] {
  const issues: QualityIssue[] = []
  questions.forEach((q, i) => {
    const label = `Question ${i + 1}`
    const opts2 = q.options.map((o) => o.trim())
    if (opts2.length < 3) {
      issues.push({ dimension: 'interactivity', severity: 'warning', description: `${label} has fewer than 3 options.` })
    }
    const lower = opts2.map((o) => o.toLowerCase())
    if (new Set(lower).size !== lower.length) {
      issues.push({ dimension: 'interactivity', severity: 'critical', description: `${label} has duplicate options.` })
    }
    if (typeof q.correct === 'number' && (q.correct < 0 || q.correct >= opts2.length)) {
      issues.push({ dimension: 'accuracy_risk', severity: 'critical', description: `${label} answer key points outside the options.` })
    }
    if (typeof q.correctAnswer === 'string' && !lower.includes(q.correctAnswer.trim().toLowerCase())) {
      issues.push({ dimension: 'accuracy_risk', severity: 'critical', description: `${label} correct answer is not one of the options.` })
    }
    if (lower.some((o) => /^(all|none) of the above$/.test(o))) {
      issues.push({
        dimension: 'bloom_fit',
        severity: 'info',
        description: `${label} uses "all/none of the above", which tests test-taking more than understanding.`,
      })
    }
    const correctIdx =
      typeof q.correct === 'number' ? q.correct : lower.indexOf((q.correctAnswer ?? '').trim().toLowerCase())
    if (correctIdx >= 0 && correctIdx < opts2.length && opts2.length >= 3) {
      const correctLen = opts2[correctIdx]!.length
      const others = opts2.filter((_, j) => j !== correctIdx).map((o) => o.length)
      const maxOther = Math.max(...others)
      if (correctLen > maxOther * 1.8 && correctLen - maxOther > 25) {
        issues.push({
          dimension: 'bloom_fit',
          severity: 'warning',
          description: `${label}: the correct option is much longer than the distractors, which gives the answer away.`,
          suggestion: 'Make distractors similar in length and plausibility.',
        })
      }
    }
  })

  const objectives = (opts.objectives ?? []).filter((o) => o.trim())
  if (objectives.length > 0 && questions.length < objectives.length) {
    issues.push({
      dimension: 'objective_alignment',
      severity: 'warning',
      description: `${objectives.length} objectives but only ${questions.length} question(s); some objectives are never assessed.`,
      suggestion: 'Write at least one question per learning objective.',
    })
  }
  return issues
}

// ---------------------------------------------------------------------------
// Gate
// ---------------------------------------------------------------------------

export type ReviewStatus = 'draft' | 'needs_review' | 'approved'

export interface GateAttempt {
  attempt: number
  overall: number | null
  critical_issues: number
}

export interface GateResult<T> {
  content: T
  assessment: QualityAssessment
  issues: QualityIssue[]
  attempts: GateAttempt[]
  review_status: ReviewStatus
  blocked: boolean
  blocked_reason?: string
}

export interface GateDeps<T> {
  /** Render content to markdown/text for judging and checks. */
  toText: (content: T) => string
  judge: (text: string) => Promise<QualityAssessment>
  /** Regenerate using the critique (issues) of the previous attempt. */
  regenerate: (previous: T, issues: QualityIssue[]) => Promise<T>
  /** Extra deterministic checks (citations, quiz keys...). */
  extraChecks?: (content: T) => QualityIssue[]
  /** Moderation; returning allowed=false blocks the content outright. */
  moderate?: (text: string) => Promise<{ allowed: boolean; reason?: string }>
}

export interface GateOptions {
  threshold: number
  maxRetries: number
}

export function hasCritical(issues: QualityIssue[]): boolean {
  return issues.some((i) => i.severity === 'critical')
}

/**
 * Judge -> regenerate-with-critique loop. Keeps the best attempt. Content that still fails after
 * retries is returned as `needs_review` (never silently approved); moderation failures are blocked.
 */
export async function runQualityGate<T>(initial: T, deps: GateDeps<T>, options: GateOptions): Promise<GateResult<T>> {
  let current = initial
  let best: { content: T; assessment: QualityAssessment; issues: QualityIssue[] } | null = null
  const attempts: GateAttempt[] = []

  for (let attempt = 0; attempt <= options.maxRetries; attempt++) {
    const text = deps.toText(current)
    const assessment = await deps.judge(text)
    const issues = [...assessment.issues, ...runDeterministicChecks(text), ...(deps.extraChecks?.(current) ?? [])]
    attempts.push({ attempt, overall: assessment.overall, critical_issues: issues.filter((i) => i.severity === 'critical').length })

    const better =
      !best ||
      (assessment.overall ?? 0) - (hasCritical(issues) ? 3 : 0) >
        (best.assessment.overall ?? 0) - (hasCritical(best.issues) ? 3 : 0)
    if (better) best = { content: current, assessment, issues }

    const passes = assessment.ok && (assessment.overall ?? 0) >= options.threshold && !hasCritical(issues)
    if (passes || attempt === options.maxRetries) break
    try {
      current = await deps.regenerate(current, issues)
    } catch {
      break
    }
  }

  const chosen = best!
  if (deps.moderate) {
    const verdict = await deps.moderate(deps.toText(chosen.content))
    if (!verdict.allowed) {
      return {
        content: chosen.content,
        assessment: chosen.assessment,
        issues: [
          ...chosen.issues,
          { dimension: 'accuracy_risk', severity: 'critical', description: `Blocked by moderation: ${verdict.reason ?? 'unsafe content'}` },
        ],
        attempts,
        review_status: 'needs_review',
        blocked: true,
        blocked_reason: verdict.reason ?? 'moderation',
      }
    }
  }

  const passed =
    chosen.assessment.ok && (chosen.assessment.overall ?? 0) >= options.threshold && !hasCritical(chosen.issues)
  return {
    content: chosen.content,
    assessment: chosen.assessment,
    issues: chosen.issues,
    attempts,
    review_status: passed ? 'draft' : 'needs_review',
    blocked: false,
  }
}

/** Format issues as an instruction block for a regeneration prompt. */
export function formatCritique(issues: QualityIssue[], max = 10): string {
  const ordered = [...issues].sort((a, b) => rank(b.severity) - rank(a.severity)).slice(0, max)
  return ordered
    .map((i, n) => `${n + 1}. [${i.severity}] (${i.dimension}) ${i.description}${i.suggestion ? ` Fix: ${i.suggestion}` : ''}`)
    .join('\n')
}

function rank(s: QualityIssue['severity']): number {
  return s === 'critical' ? 3 : s === 'warning' ? 2 : 1
}

// ---------------------------------------------------------------------------
// Stored shape (modules.quality jsonb)
// ---------------------------------------------------------------------------

export const storedModuleQualitySchema = z.object({
  overall: z.number().nullable(),
  scores: z.record(z.string(), z.number()).default({}),
  issues: z.array(qualityIssueSchema).default([]),
  attempts: z.array(z.object({ attempt: z.number(), overall: z.number().nullable(), critical_issues: z.number() })).default([]),
  judge_ok: z.boolean().default(false),
  moderation: z.object({ allowed: z.boolean(), provider: z.string().optional(), reason: z.string().optional() }).optional(),
  citations: z.object({ cited: z.array(z.number()), missing: z.array(z.number()) }).optional(),
  assessed_at: z.string(),
  resolved_issue_keys: z.array(z.string()).default([]),
})
export type StoredModuleQuality = z.infer<typeof storedModuleQualitySchema>

export function issueKey(issue: QualityIssue): string {
  return `${issue.dimension}:${issue.severity}:${issue.description.slice(0, 120)}`
}

/** Unresolved critical issues block publish. */
export function unresolvedCritical(q: StoredModuleQuality | null | undefined): QualityIssue[] {
  if (!q) return []
  const resolved = new Set(q.resolved_issue_keys)
  return q.issues.filter((i) => i.severity === 'critical' && !resolved.has(issueKey(i)))
}

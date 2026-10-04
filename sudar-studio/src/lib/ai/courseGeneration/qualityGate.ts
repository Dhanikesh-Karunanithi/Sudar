/**
 * Studio wiring for the shared quality gate: judge -> regenerate-with-critique -> moderation.
 * Every AI-generated module passes through here before it is saved.
 */

import {
  citationIssues,
  formatCritique,
  runQualityGate,
  verifyCitations,
  type GateResult,
  type QualityAssessment,
  type QualityIssue,
  type StoredModuleQuality,
} from '@shared-content-generation/quality'
import { moderateContent, type ModerationVerdict } from '@shared-content-generation/moderation'
import type { ChatCompletionContext } from '@/lib/ai/chat'
import { validateContentQuality } from './qualityValidator'
import { contentHasBannedOpening } from './introductionStrategies'

export function qualityGateConfig(env: Record<string, string | undefined> = process.env): {
  threshold: number
  maxRetries: number
} {
  const threshold = Number(env.CONTENT_QUALITY_THRESHOLD)
  const retries = Number(env.CONTENT_QUALITY_MAX_RETRIES)
  return {
    threshold: Number.isFinite(threshold) && threshold >= 1 && threshold <= 10 ? threshold : 7,
    maxRetries: Number.isInteger(retries) && retries >= 0 && retries <= 4 ? retries : 2,
  }
}

export interface GateModuleInput {
  courseTitle: string
  moduleTitle: string
  draft: string
  learningOutcomes?: string[]
  bloomLevel?: string
  documentGrounding?: string
  /** Numbered sources the module may cite as [N]; empty means any [N] is fabricated. */
  sourceIds?: number[]
  /** When false, the LLM judge is skipped and the module is marked for human review. */
  judgeEnabled?: boolean
  regenerate: (draft: string, critique: string) => Promise<string>
  chatCtx?: ChatCompletionContext
}

export interface GateModuleResult extends GateResult<string> {
  moderation: ModerationVerdict | null
}

export function markdownExtraChecks(markdown: string, sourceIds: number[] = []): QualityIssue[] {
  const issues: QualityIssue[] = []
  if (contentHasBannedOpening(markdown)) {
    issues.push({
      dimension: 'engagement',
      severity: 'warning',
      description: 'Uses a banned stock opening scenario.',
      suggestion: 'Replace the opening with a scenario specific to this module.',
    })
  }
  issues.push(...citationIssues(verifyCitations(markdown, sourceIds)))
  return issues
}

export async function gateModuleMarkdown(input: GateModuleInput): Promise<GateModuleResult> {
  const config = qualityGateConfig()
  let moderation: ModerationVerdict | null = null

  const judge = async (text: string): Promise<QualityAssessment> => {
    if (input.judgeEnabled === false) {
      return {
        ok: false,
        overall: null,
        scores: {},
        issues: [{ dimension: 'clarity', severity: 'info', description: 'Automated review disabled for this course.' }],
        judged_chars: 0,
      }
    }
    return validateContentQuality(
      {
        moduleTitle: input.moduleTitle,
        moduleContent: text,
        courseContext: input.courseTitle,
        learningOutcomes: input.learningOutcomes,
        bloomLevel: input.bloomLevel,
        groundingExcerpt: input.documentGrounding,
      },
      input.chatCtx,
    )
  }

  const result = await runQualityGate<string>(
    input.draft,
    {
      toText: (s) => s,
      judge,
      regenerate: async (previous, issues) => {
        const next = await input.regenerate(previous, formatCritique(issues))
        if (!next.trim()) throw new Error('Empty regeneration')
        return next
      },
      extraChecks: (s) => markdownExtraChecks(s, input.sourceIds),
      moderate: async (text) => {
        moderation = await moderateContent(text)
        return { allowed: moderation.allowed, reason: moderation.reason }
      },
    },
    { threshold: config.threshold, maxRetries: input.judgeEnabled === false ? 0 : config.maxRetries },
  )
  return { ...result, moderation }
}

export function toStoredQuality(
  result: GateModuleResult,
  extraIssues: QualityIssue[] = [],
  sourceIds: number[] = [],
): StoredModuleQuality {
  const citations = verifyCitations(result.content, sourceIds)
  return {
    overall: result.assessment.overall,
    scores: result.assessment.scores as Record<string, number>,
    issues: [...result.issues, ...extraIssues],
    attempts: result.attempts,
    judge_ok: result.assessment.ok,
    ...(result.moderation
      ? {
          moderation: {
            allowed: result.moderation.allowed,
            provider: result.moderation.provider,
            ...(result.moderation.reason ? { reason: result.moderation.reason } : {}),
          },
        }
      : {}),
    citations: { cited: citations.cited, missing: citations.missing },
    assessed_at: new Date().toISOString(),
    resolved_issue_keys: [],
  }
}

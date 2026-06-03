/**
 * Sudar Studio — Content Quality Validator
 * Ensures generated courses meet pedagogical standards (no AI slop)
 */

import type { ContentQualityScore, QualityIssue } from '@/types/contentThemes'
import { chatCompletion, type ChatCompletionContext } from '@/lib/ai/chat'

interface QualityValidationInput {
  moduleTitle: string
  moduleContent: string
  courseContext?: string
  learningOutcomes?: string[]
}

/**
 * Critique LLM: Score content quality
 * Returns score 1-10 with specific issues to fix
 */
export async function validateContentQuality(
  input: QualityValidationInput,
  ctx?: ChatCompletionContext
): Promise<ContentQualityScore> {
  const system = `You are an expert instructional designer and curriculum auditor. 
Your job is to review course module content and score its pedagogical quality.

Rate the module on these dimensions (1-10 each):
- Clarity: Is the explanation clear and jargon-free?
- Relevance: Does it connect to real-world problems learners care about?
- Engagement: Does it include examples, stories, or interactive elements?
- Scaffolding: Does it build progressively from simple to complex?

Find and report any of these issues:
1. Vague explanations without concrete examples
2. Outdated information or deprecated tools/practices
3. Missing context or prerequisite knowledge assumptions
4. Poor scaffolding (too abstract, too complex, too fast)
5. Weak assessment (quizzes test recall, not understanding)

Return JSON with: { overall: number, clarity: number, relevance: number, engagement: number, scaffolding: number, issues: Array<{type, severity, description, suggestion}> }`

  const user = `Module: "${input.moduleTitle}"
${input.courseContext ? `Course Context: ${input.courseContext}` : ''}
${input.learningOutcomes?.length ? `Learning Outcomes:\n${input.learningOutcomes.map((o, i) => `${i + 1}. ${o}`).join('\n')}` : ''}

--- CONTENT TO REVIEW ---
${input.moduleContent.slice(0, 2000)}

Provide a detailed quality assessment in JSON format.`

  try {
    const { content } = await chatCompletion(
      {
        messages: [
          { role: 'system', content: system },
          { role: 'user', content: user },
        ],
        max_tokens: 1000,
        temperature: 0.3, // Lower temperature = stricter critique
      },
      ctx
    )

    // Parse JSON from response
    const jsonMatch = content.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      return {
        overall: 5,
        clarity: 5,
        relevance: 5,
        engagement: 5,
        scaffolding: 5,
        issues: [{ type: 'poor_scaffolding', severity: 'warning', description: 'Unable to fully assess content quality' }],
      }
    }

    const result = JSON.parse(jsonMatch[0]) as ContentQualityScore
    return result
  } catch (err) {
    console.error('Content quality validation failed:', err)
    return {
      overall: 5,
      clarity: 5,
      relevance: 5,
      engagement: 5,
      scaffolding: 5,
      issues: [{ type: 'poor_scaffolding', severity: 'warning', description: 'Validation failed' }],
    }
  }
}

/**
 * Pedagogical Checklist
 * Automated checks for content quality
 */
export function runPedagogicalChecklist(content: string): QualityIssue[] {
  const issues: QualityIssue[] = []

  // Check 1: Real examples
  const examplePatterns = [
    /example:/i,
    /for instance/i,
    /case study/i,
    /real[- ]world/i,
    /concrete/i,
  ]
  const hasExamples = examplePatterns.some(p => p.test(content))
  if (!hasExamples && content.length > 1000) {
    issues.push({
      type: 'missing_context',
      severity: 'warning',
      description: 'No concrete examples found. Content may be too abstract.',
      suggestion: 'Add 2-3 real-world examples or case studies.',
    })
  }

  // Check 2: Learning objectives stated
  const objectivePatterns = [/after this|by the end|you will|learn(ing)? objective|learning goal/i]
  const hasObjectives = objectivePatterns.some(p => p.test(content))
  if (!hasObjectives && content.length > 500) {
    issues.push({
      type: 'poor_scaffolding',
      severity: 'info',
      description: 'No clear learning objectives stated at the beginning.',
      suggestion: 'Start with "By the end of this module, you will be able to..."',
    })
  }

  // Check 3: Assessment/quiz present
  const assessmentPatterns = [/quiz|question|challenge|try this|practice/i]
  const hasAssessment = assessmentPatterns.some(p => p.test(content))
  if (!hasAssessment && content.length > 1500) {
    issues.push({
      type: 'weak_assessment',
      severity: 'warning',
      description: 'No practice or assessment included in module.',
      suggestion: 'Add interactive quiz, scenario challenge, or reflection prompt.',
    })
  }

  // Check 4: Avoid generic phrases
  const genericPhrases = [
    /^in this (module|section|course)/im,
    /^let.?s explore/im,
    /^it is important/i,
    /^this is about/i,
    /^we will (discuss|learn|cover)/i,
  ]
  const genericMatches = genericPhrases.filter(p => p.test(content)).length
  if (genericMatches > 0) {
    issues.push({
      type: 'vague_explanation',
      severity: 'info',
      description: `Found ${genericMatches} generic opening phrases. Content may feel repetitive.`,
      suggestion: 'Start with a concrete scenario, question, or striking claim instead.',
    })
  }

  // Check 5: Technical accuracy signals (for tech courses)
  const hasCodeReferences = /\b(code|function|class|api|library|framework|module)\b/i.test(content)
  if (hasCodeReferences && !/version|2024|2025|2026|current|latest/i.test(content)) {
    issues.push({
      type: 'outdated_example',
      severity: 'info',
      description: 'Technical content present but no version/date references.',
      suggestion: 'Specify versions of tools/libraries referenced (e.g., "React 19" not just "React").',
    })
  }

  return issues
}

/**
 * Quality Gate
 * Reject content if quality score below threshold
 */
export function shouldRejectContent(score: ContentQualityScore, threshold: number = 7): boolean {
  return score.overall < threshold
}

/**
 * Get quality score interpretation
 */
export function getQualityInterpretation(score: number): string {
  if (score >= 9) return '🌟 Excellent — production ready'
  if (score >= 8) return '✅ Good — minor revisions may help'
  if (score >= 7) return '⚠️ Acceptable — consider improvements'
  if (score >= 5) return '❌ Needs work — significant revision required'
  return '🔴 Poor — reject and regenerate'
}

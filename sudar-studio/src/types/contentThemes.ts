/** Shared quality types for course generation (mirrors sudar-learn). */

export interface QualityIssue {
  type:
    | 'vague_explanation'
    | 'outdated_example'
    | 'missing_context'
    | 'poor_scaffolding'
    | 'weak_assessment'
  severity: 'info' | 'warning' | 'critical'
  description: string
  suggestion?: string
}

export interface ContentQualityScore {
  overall: number
  clarity: number
  relevance: number
  engagement: number
  scaffolding: number
  issues: QualityIssue[]
}

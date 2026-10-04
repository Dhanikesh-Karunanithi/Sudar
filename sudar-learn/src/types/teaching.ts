/**
 * Sudar Teaching OS — shared claim / mastery / session / pedagogy contracts.
 * See docs/TEACHING_OS.md.
 */

export const PEDAGOGY_MODES = [
  'intake',
  'probe',
  'teach',
  'check',
  'practice',
  'replan',
  'consolidate',
] as const
export type PedagogyMode = (typeof PEDAGOGY_MODES)[number]

export const LEARNING_SESSION_SURFACES = [
  'course',
  'conversational',
  'sim',
  'flashcards',
  'review',
  'alp',
  'dashboard',
] as const
export type LearningSessionSurface = (typeof LEARNING_SESSION_SURFACES)[number]

export const CLAIM_EDGE_KINDS = ['prerequisite', 'related'] as const
export type ClaimEdgeKind = (typeof CLAIM_EDGE_KINDS)[number]

export const CLAIM_CONTENT_LINK_KINDS = [
  'module',
  'chunk',
  'sim_scenario',
  'flashcard_set',
] as const
export type ClaimContentLinkKind = (typeof CLAIM_CONTENT_LINK_KINDS)[number]

export const CLAIM_EVIDENCE_TYPES = [
  'explain_back',
  'apply',
  'catch_error',
  'quiz',
  'flashcard',
  'sim_coach',
  'teach_back',
  'transfer',
] as const
export type ClaimEvidenceType = (typeof CLAIM_EVIDENCE_TYPES)[number]

export const DOMAIN_SOURCES = ['course', 'studio', 'import'] as const
export type DomainSource = (typeof DOMAIN_SOURCES)[number]

export interface LearningClaim {
  id: string
  domain_id: string
  stem: string
  misconceptions: string[]
  bloom: string | null
  evidence_types: ClaimEvidenceType[]
  metadata: Record<string, unknown>
  sort_order: number
  created_at?: string
}

export interface ClaimEdge {
  id: string
  domain_id: string
  from_claim_id: string
  to_claim_id: string
  kind: ClaimEdgeKind
}

export interface ClaimContentLink {
  id: string
  claim_id: string
  link_kind: ClaimContentLinkKind
  target_id: string
  metadata: Record<string, unknown>
}

export interface LearningDomain {
  id: string
  org_id: string
  title: string
  description: string | null
  source: DomainSource
  source_course_id: string | null
  version: number
  metadata: Record<string, unknown>
  created_at?: string
  updated_at?: string
}

/** Domain option for the SudarNotes topic picker (`GET /api/journey/domains`). */
export interface LearnerDomainSummary {
  id: string
  title: string
  description: string | null
}

/** Learner-facing claim summary for a course module (`GET /api/teaching/module-claims`). */
export interface ModuleClaimWithMastery {
  id: string
  stem: string
  bloom: string | null
  /** null = no evidence yet */
  p_know: number | null
  mastered: boolean
  next_review_at: string | null
}

export interface LearnerClaimMastery {
  id?: string
  user_id: string
  claim_id: string
  p_know: number
  confidence: number
  streak: number
  easiness: number
  interval_days: number
  repetitions: number
  last_evidence_at: string | null
  next_review_at: string | null
  evidence_summary: Record<string, unknown>
  updated_at?: string
}

export interface LearningSessionArtifact {
  id: string
  kind: string
  title: string
  body?: string
  claim_ids?: string[]
  status?: 'suggested' | 'accepted' | 'edited' | 'dismissed'
  metadata?: Record<string, unknown>
}

export interface LearningSessionState {
  goal: string | null
  active_claim_ids: string[]
  mode: PedagogyMode
  artifacts: LearningSessionArtifact[]
  /** Free-form working memory (compatible with SudarNotes working_memory shape). */
  working_memory: {
    goal: string | null
    active_concept: string | null
    open_questions: string[]
    known: string[]
    gaps: string[]
  }
  turns_since_check: number
  substantive_turn_count: number
  intake_complete: boolean
  last_check_prompt: string | null
  next_hint: string | null
  /** Metacognitive / study-plan hints from Phase 5 helpers. */
  metacognition?: {
    stuck_protocol?: string | null
    study_plan?: string[]
  }
}

export interface LearningSession {
  id: string
  user_id: string
  org_id: string | null
  domain_id: string | null
  surface: LearningSessionSurface
  state: LearningSessionState
  twin_snapshot: Record<string, unknown>
  created_at?: string
  updated_at?: string
}

export interface TeachSpec {
  claim_ids: string[]
  concept: string | null
  style_hint: string | null
  modality_hint: string | null
}

export interface CheckSpec {
  claim_ids: string[]
  type: ClaimEvidenceType
  prompt: string
}

export interface PracticeSpec {
  claim_ids: string[]
  kind: 'flashcard' | 'sim' | 'drill' | 'transfer' | 'teach_back'
  prompt: string
}

export interface PedagogyEngineInput {
  twin: Record<string, unknown>
  session: LearningSessionState
  active_claims: LearningClaim[]
  user_message: string
  /** Optional prior evidence from quiz/sim/flashcard this turn. */
  evidence?: {
    claim_ids: string[]
    type: ClaimEvidenceType
    correct: boolean | null
    score?: number | null
  } | null
}

export interface MasteryEventDraft {
  claim_id: string
  evidence_type: ClaimEvidenceType
  correct: boolean | null
  score?: number | null
}

export interface PedagogyEngineOutput {
  mode: PedagogyMode
  teach_spec: TeachSpec | null
  check_spec: CheckSpec | null
  practice_spec: PracticeSpec | null
  replan: { reason: string; next_claim_ids: string[] } | null
  twin_patches: Record<string, unknown>
  mastery_events: MasteryEventDraft[]
  session_patch: Partial<LearningSessionState>
}

export interface SchedulerCandidate {
  type:
    | 'review_claim'
    | 'remediate_claim'
    | 'fill_prereq'
    | 'continue_session'
    | 'continue_course'
    | 'practice_sim'
    | 'explore_domain'
  claim_ids: string[]
  reason: string
  target_id?: string | null
  title?: string | null
  priority: number
}

export interface OfflineReviewPack {
  generated_at: string
  claims: Array<{
    claim_id: string
    stem: string
    prompt: string
    misconceptions: string[]
  }>
}

export interface ClaimCredentialBundle {
  user_id: string
  domain_id: string
  demonstrated_claim_ids: string[]
  issued_at: string
  threshold_p_know: number
}

export function emptyLearningSessionState(): LearningSessionState {
  return {
    goal: null,
    active_claim_ids: [],
    mode: 'intake',
    artifacts: [],
    working_memory: {
      goal: null,
      active_concept: null,
      open_questions: [],
      known: [],
      gaps: [],
    },
    turns_since_check: 0,
    substantive_turn_count: 0,
    intake_complete: false,
    last_check_prompt: null,
    next_hint: null,
    metacognition: { stuck_protocol: null, study_plan: [] },
  }
}

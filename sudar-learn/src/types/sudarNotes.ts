/** SudarNotes pedagogical turn modes (hybrid adaptive tutor). */
export const SUDAR_NOTES_MODES = [
  'intake',
  'socratic',
  'teach',
  'check',
  'replan',
  'note_craft',
] as const
export type SudarNotesMode = (typeof SUDAR_NOTES_MODES)[number]

export const SUDAR_NOTES_CHECK_TYPES = ['explain_back', 'apply', 'catch_error'] as const
export type SudarNotesCheckType = (typeof SUDAR_NOTES_CHECK_TYPES)[number]

export const SUDAR_NOTES_CARD_KINDS = [
  'concept',
  'example',
  'open_question',
  'misconception',
  'lesson_chunk',
  'learner_prompt',
] as const
export type SudarNotesCardKind = (typeof SUDAR_NOTES_CARD_KINDS)[number]

export const SUDAR_NOTES_CARD_STATUSES = ['suggested', 'accepted', 'edited', 'dismissed'] as const
export type SudarNotesCardStatus = (typeof SUDAR_NOTES_CARD_STATUSES)[number]

export interface SudarNotesWorkingMemory {
  goal: string | null
  active_concept: string | null
  open_questions: string[]
  known: string[]
  gaps: string[]
}

export interface SudarNotesNoteOp {
  op: 'suggest' | 'update'
  card_id?: string
  kind: SudarNotesCardKind
  title: string
  body: string
}

export interface SudarNotesCheck {
  type: SudarNotesCheckType
  prompt: string
}

/** Structured pedagogical turn (parsed from model SUDAR_NOTES: line). */
export interface SudarNotesTurnPayload {
  mode: SudarNotesMode
  working_memory_patch?: Partial<SudarNotesWorkingMemory> | null
  note_ops?: SudarNotesNoteOp[]
  check?: SudarNotesCheck | null
  next_hint?: string | null
}

/** Client/server session state for SudarNotes turn engine. */
export interface SudarNotesSessionState {
  mode: SudarNotesMode
  working_memory: SudarNotesWorkingMemory
  /** Substantive dialogue turns since last soft check. */
  turns_since_check: number
  /** Total substantive learner turns this session. */
  substantive_turn_count: number
  intake_complete: boolean
  last_check_prompt?: string | null
  next_hint?: string | null
}

export function emptyWorkingMemory(): SudarNotesWorkingMemory {
  return {
    goal: null,
    active_concept: null,
    open_questions: [],
    known: [],
    gaps: [],
  }
}

export function emptySudarNotesSession(): SudarNotesSessionState {
  return {
    mode: 'intake',
    working_memory: emptyWorkingMemory(),
    turns_since_check: 0,
    substantive_turn_count: 0,
    intake_complete: false,
    last_check_prompt: null,
    next_hint: null,
  }
}

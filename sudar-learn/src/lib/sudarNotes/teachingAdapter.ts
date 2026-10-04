/**
 * SudarNotes adapter — maps Teaching OS pedagogy ↔ legacy SudarNotes session types.
 * Journey UI stays; architecture lives in lib/teaching.
 */
import type {
  LearningSessionState,
  PedagogyEngineOutput,
  PedagogyMode,
} from '@/types/teaching'
import type {
  SudarNotesMode,
  SudarNotesSessionState,
  SudarNotesTurnPayload,
} from '@/types/sudarNotes'
import { emptyWorkingMemory } from '@/types/sudarNotes'
import {
  recommendPedagogyMode,
  runPedagogyEngine,
} from '@/lib/teaching/pedagogyEngine'
import type { LearningClaim } from '@/types/teaching'

const MODE_TO_NOTES: Record<PedagogyMode, SudarNotesMode> = {
  intake: 'intake',
  probe: 'socratic',
  teach: 'teach',
  check: 'check',
  practice: 'teach',
  replan: 'replan',
  consolidate: 'note_craft',
}

const NOTES_TO_MODE: Record<SudarNotesMode, PedagogyMode> = {
  intake: 'intake',
  socratic: 'probe',
  teach: 'teach',
  check: 'check',
  replan: 'replan',
  note_craft: 'consolidate',
}

export function sudarNotesToLearningState(
  session: SudarNotesSessionState,
): LearningSessionState {
  return {
    goal: session.working_memory.goal,
    active_claim_ids: [],
    mode: NOTES_TO_MODE[session.mode] ?? 'intake',
    artifacts: [],
    working_memory: { ...session.working_memory },
    turns_since_check: session.turns_since_check,
    substantive_turn_count: session.substantive_turn_count,
    intake_complete: session.intake_complete,
    last_check_prompt: session.last_check_prompt ?? null,
    next_hint: session.next_hint ?? null,
    metacognition: { stuck_protocol: null, study_plan: [] },
  }
}

export function learningStateToSudarNotes(
  state: LearningSessionState,
): SudarNotesSessionState {
  return {
    mode: MODE_TO_NOTES[state.mode] ?? 'intake',
    working_memory: state.working_memory ?? emptyWorkingMemory(),
    turns_since_check: state.turns_since_check,
    substantive_turn_count: state.substantive_turn_count,
    intake_complete: state.intake_complete,
    last_check_prompt: state.last_check_prompt,
    next_hint: state.next_hint,
  }
}

/** Prefer Teaching OS recommender; expose SudarNotes mode for existing prompt wiring. */
export function recommendSudarNotesMode(
  session: SudarNotesSessionState,
  userMessage: string,
): SudarNotesMode {
  const learning = sudarNotesToLearningState(session)
  const mode = recommendPedagogyMode(learning, userMessage)
  return MODE_TO_NOTES[mode]
}

export function runSudarNotesPedagogy(args: {
  session: SudarNotesSessionState
  userMessage: string
  twin: Record<string, unknown>
  claims?: LearningClaim[]
}): {
  notesMode: SudarNotesMode
  engine: PedagogyEngineOutput
  nextNotes: SudarNotesSessionState
} {
  const learning = sudarNotesToLearningState(args.session)
  const engine = runPedagogyEngine({
    twin: args.twin,
    session: learning,
    active_claims: args.claims ?? [],
    user_message: args.userMessage,
  })
  const nextLearning: LearningSessionState = {
    ...learning,
    ...engine.session_patch,
    working_memory: {
      ...learning.working_memory,
      ...(engine.session_patch.working_memory ?? {}),
    },
  }
  return {
    notesMode: MODE_TO_NOTES[engine.mode],
    engine,
    nextNotes: learningStateToSudarNotes(nextLearning),
  }
}

export function pedagogyCheckToNotesTurn(
  engine: PedagogyEngineOutput,
): SudarNotesTurnPayload | null {
  if (!engine.check_spec) return null
  const type =
    engine.check_spec.type === 'apply'
      ? 'apply'
      : engine.check_spec.type === 'catch_error'
        ? 'catch_error'
        : 'explain_back'
  return {
    mode: MODE_TO_NOTES[engine.mode],
    check: { type, prompt: engine.check_spec.prompt },
    next_hint: null,
    note_ops: [],
    working_memory_patch: engine.session_patch.working_memory ?? null,
  }
}

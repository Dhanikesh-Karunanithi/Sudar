import type {
  SudarNotesMode,
  SudarNotesSessionState,
  SudarNotesTurnPayload,
  SudarNotesWorkingMemory,
} from '@/types/sudarNotes'
import { emptyWorkingMemory } from '@/types/sudarNotes'
import { recommendSudarNotesMode as recommendFromTeachingOs } from '@/lib/sudarNotes/teachingAdapter'

const CHECK_CADENCE_TURNS = 3

const RESOURCE_ASK_RE =
  /\b(find\s+(a\s+)?(video|article|resource|youtube)|put\s+them\s+in\s+my\s+notebook|verified\s+resources)\b/i

/**
 * Thin SudarNotes adapter over Teaching OS pedagogy engine.
 * Resource-ask still maps to note_craft for notebook tooling.
 */
export function recommendSudarNotesMode(
  session: SudarNotesSessionState,
  userMessage: string,
): SudarNotesMode {
  if (RESOURCE_ASK_RE.test(userMessage.trim())) {
    return 'note_craft'
  }
  return recommendFromTeachingOs(session, userMessage)
}

export function mergeWorkingMemory(
  current: SudarNotesWorkingMemory,
  patch: Partial<SudarNotesWorkingMemory> | null | undefined,
): SudarNotesWorkingMemory {
  if (!patch) return current
  return {
    goal: patch.goal !== undefined ? patch.goal : current.goal,
    active_concept:
      patch.active_concept !== undefined ? patch.active_concept : current.active_concept,
    open_questions: patch.open_questions ?? current.open_questions,
    known: patch.known ?? current.known,
    gaps: patch.gaps ?? current.gaps,
  }
}

export function applySudarNotesTurnToSession(
  session: SudarNotesSessionState,
  turn: SudarNotesTurnPayload | null,
  opts: { forcedMode?: SudarNotesMode; hadSoftCheck: boolean },
): SudarNotesSessionState {
  const mode = turn?.mode ?? opts.forcedMode ?? session.mode
  const working_memory = mergeWorkingMemory(
    session.working_memory ?? emptyWorkingMemory(),
    turn?.working_memory_patch,
  )
  const intake_complete =
    session.intake_complete ||
    Boolean(working_memory.goal && working_memory.goal.trim().length > 0) ||
    mode !== 'intake'

  const hadCheck = opts.hadSoftCheck || Boolean(turn?.check?.prompt) || mode === 'check'
  const turns_since_check = hadCheck ? 0 : session.turns_since_check + 1

  return {
    mode,
    working_memory,
    turns_since_check,
    substantive_turn_count: session.substantive_turn_count + 1,
    intake_complete,
    last_check_prompt: turn?.check?.prompt ?? (hadCheck ? session.last_check_prompt : null),
    next_hint: turn?.next_hint ?? session.next_hint ?? null,
  }
}

export function formatWorkingMemoryForPrompt(wm: SudarNotesWorkingMemory): string {
  const lines = [
    `Goal: ${wm.goal?.trim() || '(not set yet)'}`,
    `Active concept: ${wm.active_concept?.trim() || '(none)'}`,
    `Open questions: ${wm.open_questions.length ? wm.open_questions.join('; ') : '(none)'}`,
    `Likely known: ${wm.known.length ? wm.known.join('; ') : '(none)'}`,
    `Gaps: ${wm.gaps.length ? wm.gaps.join('; ') : '(none)'}`,
  ]
  return lines.join('\n')
}

/** System prompt block for SudarNotes (replaces roadmap Journey teaching block). */
export function buildSudarNotesTeachingBlock(args: {
  session: SudarNotesSessionState
  recommendedMode: SudarNotesMode
}): string {
  const { session, recommendedMode } = args
  const forceCheck =
    recommendedMode === 'check'
      ? `\n**This turn MUST use mode "check"** with a soft explain-back, apply, or catch-the-error prompt. Do not lecture.`
      : ''
  const forceIntake =
    recommendedMode === 'intake'
      ? `\n**This turn MUST use mode "intake"**: clarify goal and level with 1–2 short questions. Do NOT give a roadmap, syllabus, or multi-step outline.`
      : ''

  return `
## SudarNotes (conversational personal tutor)
The learner is on **SudarNotes**. Chat = short dialogue only. **Living notebook** = independent note cards the learner owns (you SUGGEST; they accept/edit). Working memory tracks goal, active concept, open questions, gaps.

### Continuity (critical)
- Read conversation history and working memory. Continue the same thread.
- Never reset with "What would you like to learn today?" unless they clearly changed subjects.
- Short replies ("continue", "I don't get it", "plan it") are continuations — deepen or check; do not dump a new syllabus.

### Modes (pick one per turn; recommended: **${recommendedMode}**)
- **intake** — Goal + experience; 1–2 questions. No roadmap. No web links.
- **socratic** — Probe with questions; celebrate partial answers; do not lecture yet.
- **teach** — ONE idea + analogy. Suggest at most one note card. Invite a tiny try.
- **check** — Soft conversational check (explain-it-back / apply / catch-the-error). No quiz vibes.
- **replan** — Name what landed; pick the next micro-goal. No 5–8 module tables unless they explicitly asked for a course outline.
- **note_craft** — Co-author notes; suggest/update cards; ask before large structures.
${forceIntake}${forceCheck}

### Hard rules (anti-slop)
1. **Never** open with a "quick roadmap", numbered 4–5 step syllabus, or module table unless the learner explicitly asked for an outline/course draft.
2. **Never** invent or auto-attach web/YouTube resources. Resources only when they ask (or use Find resources).
3. Chat body = short **Markdown** dialogue. Put durable content in note_ops as **suggestions**, not walls of prose.
4. One idea at a time. Prefer questions before lectures when mode is intake/socratic/check.
5. Always write a real chat answer **before** the SUDAR_NOTES line.

### Working memory (current)
${formatWorkingMemoryForPrompt(session.working_memory)}
Intake complete: ${session.intake_complete ? 'yes' : 'no'}
Turns since last check: ${session.turns_since_check}
Prior hint: ${session.next_hint?.trim() || '(none)'}

### Output contract
After your chat Markdown, end with exactly one line:
SUDAR_NOTES: {"mode":"${recommendedMode}","working_memory_patch":{"goal":"...","active_concept":"...","open_questions":[],"known":[],"gaps":[]},"note_ops":[{"op":"suggest","kind":"concept","title":"...","body":"..."}],"check":null,"next_hint":"..."}

Rules for SUDAR_NOTES JSON:
- mode: one of intake|socratic|teach|check|replan|note_craft
- working_memory_patch: only fields you are updating (goal string once known)
- note_ops: 0–2 items; prefer suggest; kinds: concept|example|open_question|misconception|lesson_chunk|learner_prompt
- check: { "type": "explain_back"|"apply"|"catch_error", "prompt": "..." } when mode is check; else null
- next_hint: short private continuity note (not shown to learner)
- Do **not** put full HTML lessons in chat. Optional choice_group via BLOCKS only for tap-to-continue.

Example (intake):
You want pedagogy from an LMS lens — designing courses, choosing features, or both? Rough experience level?

SUDAR_NOTES: {"mode":"intake","working_memory_patch":{"goal":"Pedagogy + intentional LMS design","open_questions":["Designing courses vs choosing LMS features?","Experience level?"],"gaps":["Intentional tech design"]},"note_ops":[],"check":null,"next_hint":"After level, teach one idea: pedagogy ≠ content dump"}
`
}

export { CHECK_CADENCE_TURNS }

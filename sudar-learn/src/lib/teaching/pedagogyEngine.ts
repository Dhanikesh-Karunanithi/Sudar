import type {
  LearningClaim,
  LearningSessionState,
  PedagogyEngineInput,
  PedagogyEngineOutput,
  PedagogyMode,
} from '@/types/teaching'
import { suggestStuckProtocol } from '@/lib/teaching/depth'

const CHECK_CADENCE_TURNS = 3

const FRUSTRATION_RE =
  /\b(i\s+don'?t\s+understand|confused|too\s+fast|slow\s+down|this\s+isn'?t\s+helping|frustrated|lost|overwhelmed)\b/i

const EXPLICIT_PLAN_RE =
  /\b(course\s+outline|syllabus|module\s+list|full\s+roadmap|lesson\s+plan\s+for\s+the\s+whole)\b/i

const PRACTICE_ASK_RE =
  /\b(practice|drill|quiz\s+me|flashcards?|role\s*play|scenario)\b/i

const TEACH_BACK_RE =
  /\b(let\s+me\s+teach|i'?ll\s+explain|teach\s+it\s+back)\b/i

/**
 * Surface-agnostic pedagogical mode recommender.
 */
export function recommendPedagogyMode(
  session: LearningSessionState,
  userMessage: string,
): PedagogyMode {
  const msg = userMessage.trim()
  if (!session.intake_complete || !session.working_memory.goal) {
    return 'intake'
  }
  if (FRUSTRATION_RE.test(msg)) {
    return 'teach'
  }
  if (TEACH_BACK_RE.test(msg)) {
    return 'practice'
  }
  if (PRACTICE_ASK_RE.test(msg)) {
    return 'practice'
  }
  if (EXPLICIT_PLAN_RE.test(msg)) {
    return 'consolidate'
  }
  if (
    session.turns_since_check >= CHECK_CADENCE_TURNS &&
    session.substantive_turn_count >= 2
  ) {
    return 'check'
  }
  if (session.mode === 'check') {
    return 'replan'
  }
  if (session.mode === 'intake' || session.mode === 'replan') {
    return 'probe'
  }
  if (session.mode === 'probe') {
    return 'teach'
  }
  if (session.mode === 'teach') {
    return session.turns_since_check + 1 >= CHECK_CADENCE_TURNS ? 'check' : 'probe'
  }
  if (session.mode === 'practice') {
    return 'check'
  }
  return 'teach'
}

function primaryClaim(claims: LearningClaim[], session: LearningSessionState): LearningClaim | null {
  if (session.active_claim_ids[0]) {
    const hit = claims.find((c) => c.id === session.active_claim_ids[0])
    if (hit) return hit
  }
  return claims[0] ?? null
}

/**
 * Core Teaching OS pedagogy engine — UI-agnostic.
 */
export function runPedagogyEngine(input: PedagogyEngineInput): PedagogyEngineOutput {
  const mode = recommendPedagogyMode(input.session, input.user_message)
  const claim = primaryClaim(input.active_claims, input.session)
  const claimIds = claim ? [claim.id] : input.session.active_claim_ids
  const concept =
    claim?.stem ??
    input.session.working_memory.active_concept ??
    null

  const twin = input.twin
  const style =
    typeof twin.preferred_explanation_style === 'string'
      ? twin.preferred_explanation_style
      : typeof twin.explanation_style === 'string'
        ? twin.explanation_style
        : null
  const modalityScores = (twin.modality_scores as Record<string, number> | undefined) ?? {}
  const modality_hint =
    Object.entries(modalityScores).sort((a, b) => (b[1] ?? 0) - (a[1] ?? 0))[0]?.[0] ?? null

  const mastery_events =
    input.evidence && input.evidence.claim_ids.length
      ? input.evidence.claim_ids.map((claim_id) => ({
          claim_id,
          evidence_type: input.evidence!.type,
          correct: input.evidence!.correct,
          score: input.evidence!.score ?? null,
        }))
      : []

  let teach_spec: PedagogyEngineOutput['teach_spec'] = null
  let check_spec: PedagogyEngineOutput['check_spec'] = null
  let practice_spec: PedagogyEngineOutput['practice_spec'] = null
  let replan: PedagogyEngineOutput['replan'] = null

  if (mode === 'teach' || mode === 'probe') {
    teach_spec = {
      claim_ids: claimIds,
      concept,
      style_hint: style,
      modality_hint,
    }
  }

  if (mode === 'check') {
    const mis = claim?.misconceptions?.[0]
    const type =
      claim?.evidence_types?.includes('catch_error') && mis
        ? 'catch_error'
        : claim?.evidence_types?.includes('apply')
          ? 'apply'
          : 'explain_back'
    const prompt =
      type === 'catch_error' && mis
        ? `What’s wrong with this idea: “${mis}”?`
        : type === 'apply'
          ? `In one concrete example, apply: ${concept ?? 'the idea we just covered'}.`
          : `In one sentence, explain “${concept ?? 'the active idea'}” in your own words.`
    check_spec = { claim_ids: claimIds, type, prompt }
  }

  if (mode === 'practice') {
    const kind = TEACH_BACK_RE.test(input.user_message)
      ? 'teach_back'
      : /\bsim|role\s*play|scenario\b/i.test(input.user_message)
        ? 'sim'
        : /\bflashcard/i.test(input.user_message)
          ? 'flashcard'
          : 'transfer'
    practice_spec = {
      claim_ids: claimIds,
      kind,
      prompt:
        kind === 'teach_back'
          ? `Teach me “${concept ?? 'this idea'}” as if I am new to it.`
          : kind === 'transfer'
            ? `Transfer task: use “${concept ?? 'this idea'}” in a new situation you have not seen yet.`
            : `Practice “${concept ?? 'this idea'}”.`,
    }
  }

  if (mode === 'replan') {
    replan = {
      reason: 'Adjust path after check or struggle',
      next_claim_ids: claimIds,
    }
  }

  const stuck = FRUSTRATION_RE.test(input.user_message)
    ? suggestStuckProtocol(concept)
    : input.session.metacognition?.stuck_protocol ?? null

  const intake_complete =
    input.session.intake_complete ||
    Boolean(input.session.working_memory.goal?.trim()) ||
    mode !== 'intake'

  const hadCheck = mode === 'check' || Boolean(check_spec)
  const turns_since_check = hadCheck ? 0 : input.session.turns_since_check + 1

  const twin_patches: Record<string, unknown> = {}
  if (input.session.working_memory.goal) {
    twin_patches.active_goals = [input.session.working_memory.goal]
  }
  if (input.session.working_memory.known.length) {
    twin_patches.known_concepts = input.session.working_memory.known
  }
  if (input.session.working_memory.gaps.length) {
    twin_patches.struggles_with = input.session.working_memory.gaps
  }
  if (claimIds.length) {
    twin_patches.teaching_os = {
      active_claim_ids: claimIds,
      last_mode: mode,
    }
  }

  return {
    mode,
    teach_spec,
    check_spec,
    practice_spec,
    replan,
    twin_patches,
    mastery_events,
    session_patch: {
      mode,
      intake_complete,
      turns_since_check,
      substantive_turn_count: input.session.substantive_turn_count + 1,
      last_check_prompt: check_spec?.prompt ?? input.session.last_check_prompt,
      active_claim_ids: claimIds.length ? claimIds : input.session.active_claim_ids,
      metacognition: {
        stuck_protocol: stuck,
        study_plan: input.session.metacognition?.study_plan ?? [],
      },
      working_memory: {
        ...input.session.working_memory,
        active_concept: concept ?? input.session.working_memory.active_concept,
        goal: input.session.working_memory.goal,
      },
    },
  }
}

export function buildPedagogyPromptBlock(args: {
  mode: PedagogyMode
  output: PedagogyEngineOutput
  claims: LearningClaim[]
}): string {
  const claimLines = args.claims
    .slice(0, 8)
    .map((c) => `- (${c.id.slice(0, 8)}) ${c.stem}`)
    .join('\n')
  const mis = args.claims[0]?.misconceptions?.slice(0, 3).join('; ') ?? ''
  return [
    `## Teaching OS pedagogy`,
    `Recommended mode: **${args.mode}** (follow this mode).`,
    args.output.teach_spec
      ? `Teach focus: ${args.output.teach_spec.concept ?? 'active claim'}; style: ${args.output.teach_spec.style_hint ?? 'default'}; modality hint: ${args.output.teach_spec.modality_hint ?? 'any'}.`
      : '',
    args.output.check_spec
      ? `Soft check (${args.output.check_spec.type}): ${args.output.check_spec.prompt}`
      : '',
    args.output.practice_spec
      ? `Practice (${args.output.practice_spec.kind}): ${args.output.practice_spec.prompt}`
      : '',
    args.output.replan ? `Replan: ${args.output.replan.reason}` : '',
    claimLines ? `Active / available claims:\n${claimLines}` : 'No claims linked yet — teach carefully and propose assessable claims in notes.',
    mis ? `Watch for misconceptions: ${mis}` : '',
    `Every teach stretch should lead to a check. Do not dump a full syllabus.`,
  ]
    .filter(Boolean)
    .join('\n')
}

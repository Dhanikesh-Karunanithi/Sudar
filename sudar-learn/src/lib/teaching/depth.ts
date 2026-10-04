import type {
  ClaimCredentialBundle,
  LearningClaim,
  OfflineReviewPack,
} from '@/types/teaching'
import { MASTERED_THRESHOLD } from '@/lib/teaching/mastery'

/** Metacognitive stuck protocol copy. */
export function suggestStuckProtocol(concept: string | null): string {
  const c = concept?.trim() || 'this idea'
  return [
    `Pause on “${c}”.`,
    '1) Restate the goal in your own words.',
    '2) Point to one concrete example you already know.',
    '3) Ask Sudar for a simpler analogy — then try an explain-back.',
  ].join(' ')
}

export function buildStudyPlan(claimStems: string[], minutes: number): string[] {
  const slice = Math.max(1, Math.floor(minutes / 5))
  return claimStems.slice(0, slice).map((stem, i) => {
    const step = i === 0 ? 'Review' : i === slice - 1 ? 'Check' : 'Practice'
    return `${step} (${Math.min(5, minutes)} min): ${stem.slice(0, 100)}`
  })
}

/** Confront a likely misconception tied to a claim. */
export function misconceptionConfrontation(
  claim: LearningClaim | null,
): { prompt: string; misconception: string } | null {
  const m = claim?.misconceptions?.[0]
  if (!m || !claim) return null
  return {
    misconception: m,
    prompt: `Common mix-up: “${m}”. Why is that incomplete for: ${claim.stem}?`,
  }
}

/** Transfer / teach-back check prompts against a claim. */
export function transferCheckPrompt(claim: LearningClaim): string {
  return `Transfer: invent a new situation (not from the lesson) where “${claim.stem}” matters, and apply it in 2–3 sentences.`
}

export function teachBackPrompt(claim: LearningClaim): string {
  return `Teach-back: explain “${claim.stem}” to a beginner. Include one example and one warning about a common mistake.`
}

export function buildOfflineReviewPack(
  claims: LearningClaim[],
  dueClaimIds: string[],
): OfflineReviewPack {
  const set = new Set(dueClaimIds)
  const selected = claims.filter((c) => set.has(c.id)).slice(0, 20)
  return {
    generated_at: new Date().toISOString(),
    claims: selected.map((c) => ({
      claim_id: c.id,
      stem: c.stem,
      prompt: `Without looking: explain or apply — ${c.stem}`,
      misconceptions: c.misconceptions.slice(0, 3),
    })),
  }
}

export function buildClaimCredentialBundle(args: {
  userId: string
  domainId: string
  mastery: Array<{ claim_id: string; p_know: number }>
  threshold?: number
}): ClaimCredentialBundle {
  const threshold = args.threshold ?? MASTERED_THRESHOLD
  return {
    user_id: args.userId,
    domain_id: args.domainId,
    demonstrated_claim_ids: args.mastery
      .filter((m) => m.p_know >= threshold)
      .map((m) => m.claim_id),
    issued_at: new Date().toISOString(),
    threshold_p_know: threshold,
  }
}

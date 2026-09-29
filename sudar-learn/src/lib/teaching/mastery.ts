import type { SupabaseClient } from '@supabase/supabase-js'
import type { ClaimEvidenceType, LearnerClaimMastery } from '@/types/teaching'

const MASTERED_THRESHOLD = 0.75
const WEAK_THRESHOLD = 0.45

export { MASTERED_THRESHOLD, WEAK_THRESHOLD }

function clamp01(n: number): number {
  return Math.max(0, Math.min(1, n))
}

/** Map evidence to SM-2 quality 0–5. */
export function evidenceToQuality(args: {
  correct: boolean | null
  score?: number | null
}): number {
  if (typeof args.score === 'number' && Number.isFinite(args.score)) {
    return Math.round(clamp01(args.score) * 5)
  }
  if (args.correct === true) return 4
  if (args.correct === false) return 1
  return 3
}

/**
 * SM-2-ish interval update + BKT-lite p_know nudge.
 */
export function applyEvidenceToMastery(
  current: LearnerClaimMastery | null,
  userId: string,
  claimId: string,
  evidence: {
    evidence_type: ClaimEvidenceType
    correct: boolean | null
    score?: number | null
  },
  now = new Date(),
): LearnerClaimMastery {
  const quality = evidenceToQuality(evidence)
  const base: LearnerClaimMastery = current ?? {
    user_id: userId,
    claim_id: claimId,
    p_know: 0.3,
    confidence: 0.3,
    streak: 0,
    easiness: 2.5,
    interval_days: 0,
    repetitions: 0,
    last_evidence_at: null,
    next_review_at: null,
    evidence_summary: {},
  }

  let easiness = base.easiness + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02))
  if (easiness < 1.3) easiness = 1.3

  let repetitions = base.repetitions
  let interval_days = base.interval_days
  let streak = base.streak

  if (quality < 3) {
    repetitions = 0
    interval_days = 0
    streak = 0
  } else {
    streak = streak + 1
    if (repetitions === 0) {
      interval_days = 1
    } else if (repetitions === 1) {
      interval_days = 3
    } else {
      interval_days = Math.max(1, Math.round(interval_days * easiness))
    }
    repetitions += 1
  }

  const delta = quality >= 3 ? 0.12 + quality * 0.02 : -(0.15 + (3 - quality) * 0.05)
  const p_know = clamp01(base.p_know + delta)
  const confidence = clamp01(base.confidence * 0.7 + (quality / 5) * 0.3 + (quality >= 3 ? 0.1 : -0.05))

  const next = new Date(now.getTime() + interval_days * 86400000)

  const priorTypes = Array.isArray(base.evidence_summary.types)
    ? (base.evidence_summary.types as string[])
    : []
  const evidence_summary = {
    ...base.evidence_summary,
    last_type: evidence.evidence_type,
    last_quality: quality,
    types: [...new Set([...priorTypes, evidence.evidence_type])].slice(-12),
  }

  return {
    ...base,
    user_id: userId,
    claim_id: claimId,
    p_know,
    confidence,
    streak,
    easiness,
    interval_days,
    repetitions,
    last_evidence_at: now.toISOString(),
    next_review_at: next.toISOString(),
    evidence_summary,
    updated_at: now.toISOString(),
  }
}

export async function loadMasteryForUser(
  admin: SupabaseClient,
  userId: string,
  claimIds?: string[],
): Promise<LearnerClaimMastery[]> {
  let q = admin.from('learner_claim_mastery').select('*').eq('user_id', userId)
  if (claimIds?.length) q = q.in('claim_id', claimIds)
  const { data } = await q
  return (data ?? []).map((row) => ({
    id: String(row.id),
    user_id: String(row.user_id),
    claim_id: String(row.claim_id),
    p_know: Number(row.p_know ?? 0.3),
    confidence: Number(row.confidence ?? 0.3),
    streak: Number(row.streak ?? 0),
    easiness: Number(row.easiness ?? 2.5),
    interval_days: Number(row.interval_days ?? 0),
    repetitions: Number(row.repetitions ?? 0),
    last_evidence_at: row.last_evidence_at != null ? String(row.last_evidence_at) : null,
    next_review_at: row.next_review_at != null ? String(row.next_review_at) : null,
    evidence_summary: (row.evidence_summary as Record<string, unknown>) ?? {},
    updated_at: row.updated_at != null ? String(row.updated_at) : undefined,
  }))
}

export async function upsertMastery(
  admin: SupabaseClient,
  mastery: LearnerClaimMastery,
): Promise<LearnerClaimMastery> {
  const { data, error } = await admin
    .from('learner_claim_mastery')
    .upsert(
      {
        user_id: mastery.user_id,
        claim_id: mastery.claim_id,
        p_know: mastery.p_know,
        confidence: mastery.confidence,
        streak: mastery.streak,
        easiness: mastery.easiness,
        interval_days: mastery.interval_days,
        repetitions: mastery.repetitions,
        last_evidence_at: mastery.last_evidence_at,
        next_review_at: mastery.next_review_at,
        evidence_summary: mastery.evidence_summary,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id,claim_id' },
    )
    .select('*')
    .single()
  if (error) throw error
  return {
    ...mastery,
    id: String(data.id),
    updated_at: String(data.updated_at),
  }
}

export async function recordClaimEvidence(
  admin: SupabaseClient,
  args: {
    userId: string
    claimId: string
    evidence_type: ClaimEvidenceType
    correct: boolean | null
    score?: number | null
    courseId?: string | null
    moduleId?: string | null
    modality?: string | null
  },
): Promise<LearnerClaimMastery> {
  const existing = await loadMasteryForUser(admin, args.userId, [args.claimId])
  const next = applyEvidenceToMastery(existing[0] ?? null, args.userId, args.claimId, {
    evidence_type: args.evidence_type,
    correct: args.correct,
    score: args.score,
  })
  const saved = await upsertMastery(admin, next)

  await admin.from('learning_events').insert({
    user_id: args.userId,
    course_id: args.courseId ?? null,
    module_id: args.moduleId ?? null,
    event_type: 'claim_check',
    modality: args.modality ?? null,
    payload: {
      claim_id: args.claimId,
      evidence_type: args.evidence_type,
      correct: args.correct,
      score: args.score ?? null,
      p_know: saved.p_know,
      next_review_at: saved.next_review_at,
    },
  })

  await admin.from('learning_events').insert({
    user_id: args.userId,
    course_id: args.courseId ?? null,
    module_id: args.moduleId ?? null,
    event_type: 'claim_mastery_update',
    modality: args.modality ?? null,
    payload: {
      claim_id: args.claimId,
      p_know: saved.p_know,
      confidence: saved.confidence,
      next_review_at: saved.next_review_at,
    },
  })

  return saved
}

export function isDue(mastery: LearnerClaimMastery, now = new Date()): boolean {
  if (!mastery.next_review_at) return mastery.p_know < MASTERED_THRESHOLD
  return new Date(mastery.next_review_at).getTime() <= now.getTime()
}

export function isWeak(mastery: LearnerClaimMastery): boolean {
  return mastery.p_know < WEAK_THRESHOLD
}

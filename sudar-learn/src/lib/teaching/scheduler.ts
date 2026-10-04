import type { SupabaseClient } from '@supabase/supabase-js'
import type { SchedulerCandidate } from '@/types/teaching'
import { loadDomainGraph, prerequisiteClosure } from '@/lib/teaching/claimGraph'
import {
  isDue,
  isWeak,
  loadMasteryForUser,
  MASTERED_THRESHOLD,
} from '@/lib/teaching/mastery'

/**
 * Build prioritized Teaching OS scheduler candidates for a learner.
 * Priority: overdue reviews → weak/failed → prereq gaps → (callers append session/course/sim).
 */
export async function buildClaimSchedulerCandidates(
  admin: SupabaseClient,
  userId: string,
  options?: { domainId?: string | null; limit?: number },
): Promise<SchedulerCandidate[]> {
  const limit = options?.limit ?? 12
  const now = new Date()

  let claimFilter: string[] | undefined
  let edges: Awaited<ReturnType<typeof loadDomainGraph>> extends infer G
    ? G extends { edges: infer E }
      ? E
      : never
    : never = [] as never
  let stems = new Map<string, string>()

  if (options?.domainId) {
    const graph = await loadDomainGraph(admin, options.domainId)
    if (!graph) return []
    claimFilter = graph.claims.map((c) => c.id)
    edges = graph.edges
    stems = new Map(graph.claims.map((c) => [c.id, c.stem]))
  } else {
    const { data: masteryRows } = await admin
      .from('learner_claim_mastery')
      .select('claim_id')
      .eq('user_id', userId)
      .limit(200)
    claimFilter = (masteryRows ?? []).map((r) => String(r.claim_id))
    if (claimFilter.length) {
      const { data: claims } = await admin
        .from('learning_claims')
        .select('id, stem, domain_id')
        .in('id', claimFilter)
      stems = new Map((claims ?? []).map((c) => [String(c.id), String(c.stem)]))
      const domainIds = [...new Set((claims ?? []).map((c) => String(c.domain_id)))]
      if (domainIds[0]) {
        const g = await loadDomainGraph(admin, domainIds[0])
        if (g) edges = g.edges
      }
    }
  }

  if (!claimFilter?.length) return []

  const mastery = await loadMasteryForUser(admin, userId, claimFilter)
  const byClaim = new Map(mastery.map((m) => [m.claim_id, m]))
  const candidates: SchedulerCandidate[] = []

  for (const claimId of claimFilter) {
    const m = byClaim.get(claimId)
    const stem = stems.get(claimId) ?? claimId
    if (m && isDue(m, now)) {
      candidates.push({
        type: 'review_claim',
        claim_ids: [claimId],
        reason: `Review due: ${stem.slice(0, 80)}`,
        priority: 100 + (1 - m.p_know) * 20,
        title: stem.slice(0, 100),
      })
    } else if (m && isWeak(m)) {
      candidates.push({
        type: 'remediate_claim',
        claim_ids: [claimId],
        reason: `Strengthen: ${stem.slice(0, 80)}`,
        priority: 80 + (WEAK_GAP(m.p_know)),
        title: stem.slice(0, 100),
      })
    } else if (!m) {
      candidates.push({
        type: 'explore_domain',
        claim_ids: [claimId],
        reason: `Not yet assessed: ${stem.slice(0, 80)}`,
        priority: 40,
        title: stem.slice(0, 100),
      })
    }
  }

  // Prerequisite gaps for active weak claims
  for (const c of [...candidates]) {
    if (c.type !== 'remediate_claim' && c.type !== 'review_claim') continue
    const target = c.claim_ids[0]
    if (!target) continue
    for (const pre of prerequisiteClosure(target, edges)) {
      const pm = byClaim.get(pre)
      if (!pm || pm.p_know < MASTERED_THRESHOLD) {
        const stem = stems.get(pre) ?? pre
        candidates.push({
          type: 'fill_prereq',
          claim_ids: [pre],
          reason: `Prerequisite gap before “${(stems.get(target) ?? target).slice(0, 60)}”: ${stem.slice(0, 60)}`,
          priority: 90,
          title: stem.slice(0, 100),
        })
      }
    }
  }

  candidates.sort((a, b) => b.priority - a.priority)
  return dedupeByFirstClaim(candidates).slice(0, limit)
}

function WEAK_GAP(p: number): number {
  return (0.45 - p) * 30
}

function dedupeByFirstClaim(list: SchedulerCandidate[]): SchedulerCandidate[] {
  const seen = new Set<string>()
  const out: SchedulerCandidate[] = []
  for (const c of list) {
    const key = `${c.type}:${c.claim_ids[0] ?? ''}`
    if (seen.has(key)) continue
    seen.add(key)
    out.push(c)
  }
  return out
}

export async function pickNextFifteenMinutes(
  admin: SupabaseClient,
  userId: string,
): Promise<SchedulerCandidate | null> {
  const claimOnes = await buildClaimSchedulerCandidates(admin, userId, { limit: 5 })
  return claimOnes[0] ?? null
}

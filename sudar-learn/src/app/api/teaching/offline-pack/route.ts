import { createClient, createServiceRoleSupabaseClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { loadDomainGraph } from '@/lib/teaching/claimGraph'
import { buildClaimSchedulerCandidates } from '@/lib/teaching/scheduler'
import { buildOfflineReviewPack } from '@/lib/teaching/depth'

export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })

  const domainId = request.nextUrl.searchParams.get('domain_id')
  const admin = createServiceRoleSupabaseClient()
  const queue = await buildClaimSchedulerCandidates(admin, user.id, {
    domainId: domainId || null,
    limit: 20,
  })
  const dueIds = queue
    .filter((c) => c.type === 'review_claim' || c.type === 'remediate_claim')
    .flatMap((c) => c.claim_ids)

  let claims = [] as Awaited<ReturnType<typeof loadDomainGraph>> extends infer G
    ? G extends { claims: infer C }
      ? C
      : never
    : never

  if (domainId) {
    const graph = await loadDomainGraph(admin, domainId)
    claims = graph?.claims ?? ([] as typeof claims)
  } else if (dueIds.length) {
    const { data } = await admin.from('learning_claims').select('*').in('id', dueIds)
    claims = (data ?? []).map((row) => ({
      id: String(row.id),
      domain_id: String(row.domain_id),
      stem: String(row.stem),
      misconceptions: Array.isArray(row.misconceptions)
        ? (row.misconceptions as string[])
        : [],
      bloom: row.bloom != null ? String(row.bloom) : null,
      evidence_types: (row.evidence_types as never) ?? ['explain_back'],
      metadata: (row.metadata as Record<string, unknown>) ?? {},
      sort_order: Number(row.sort_order ?? 0),
    }))
  }

  const pack = buildOfflineReviewPack(claims, dueIds.length ? dueIds : claims.map((c) => c.id))
  return NextResponse.json({ success: true, data: pack })
}

import { createClient, createServiceRoleSupabaseClient } from '@/lib/supabase/server'
import { getOrCreateOrg } from '@/lib/org'
import { NextRequest, NextResponse } from 'next/server'

/** Claim struggle heatmap: low p_know + recent claim_check fails. */
export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const domainId = request.nextUrl.searchParams.get('domain_id')
  const admin = createServiceRoleSupabaseClient()
  const orgId = await getOrCreateOrg(user.id)

  let claimQuery = admin.from('learning_claims').select('id, stem, domain_id')
  if (domainId) {
    const { data: domain } = await admin
      .from('learning_domains')
      .select('id')
      .eq('id', domainId)
      .eq('org_id', orgId)
      .maybeSingle()
    if (!domain) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    claimQuery = claimQuery.eq('domain_id', domainId)
  } else {
    const { data: domains } = await admin.from('learning_domains').select('id').eq('org_id', orgId)
    const ids = (domains ?? []).map((d) => String(d.id))
    if (!ids.length) return NextResponse.json({ success: true, data: [] })
    claimQuery = claimQuery.in('domain_id', ids)
  }

  const { data: claims } = await claimQuery.limit(200)
  const claimIds = (claims ?? []).map((c) => String(c.id))
  if (!claimIds.length) return NextResponse.json({ success: true, data: [] })

  const { data: mastery } = await admin
    .from('learner_claim_mastery')
    .select('claim_id, p_know, user_id')
    .in('claim_id', claimIds)

  const byClaim = new Map<string, { count: number; sumP: number; weak: number }>()
  for (const row of mastery ?? []) {
    const id = String(row.claim_id)
    const cur = byClaim.get(id) ?? { count: 0, sumP: 0, weak: 0 }
    const p = Number(row.p_know ?? 0)
    cur.count += 1
    cur.sumP += p
    if (p < 0.45) cur.weak += 1
    byClaim.set(id, cur)
  }

  const heatmap = (claims ?? [])
    .map((c) => {
      const id = String(c.id)
      const stats = byClaim.get(id)
      return {
        claim_id: id,
        stem: String(c.stem),
        domain_id: String(c.domain_id),
        learners: stats?.count ?? 0,
        avg_p_know: stats && stats.count ? stats.sumP / stats.count : null,
        weak_learners: stats?.weak ?? 0,
      }
    })
    .sort((a, b) => (b.weak_learners ?? 0) - (a.weak_learners ?? 0))

  return NextResponse.json({ success: true, data: heatmap })
}

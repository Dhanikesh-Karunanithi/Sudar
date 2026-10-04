import { createClient, createServiceRoleSupabaseClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { loadMasteryForUser } from '@/lib/teaching/mastery'
import { buildClaimCredentialBundle } from '@/lib/teaching/depth'
import { loadDomainGraph } from '@/lib/teaching/claimGraph'

export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })

  const domainId = request.nextUrl.searchParams.get('domain_id')
  if (!domainId) {
    return NextResponse.json({ success: false, error: 'domain_id required' }, { status: 400 })
  }

  const admin = createServiceRoleSupabaseClient()
  const graph = await loadDomainGraph(admin, domainId)
  if (!graph) {
    return NextResponse.json({ success: false, error: 'Domain not found' }, { status: 404 })
  }

  const mastery = await loadMasteryForUser(
    admin,
    user.id,
    graph.claims.map((c) => c.id),
  )
  const bundle = buildClaimCredentialBundle({
    userId: user.id,
    domainId,
    mastery: mastery.map((m) => ({ claim_id: m.claim_id, p_know: m.p_know })),
  })

  return NextResponse.json({
    success: true,
    data: {
      ...bundle,
      claims: graph.claims.filter((c) => bundle.demonstrated_claim_ids.includes(c.id)),
    },
  })
}

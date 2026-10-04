import { createClient, createServiceRoleSupabaseClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import {
  buildStudyPlan,
  misconceptionConfrontation,
  teachBackPrompt,
  transferCheckPrompt,
} from '@/lib/teaching/depth'
import { loadDomainGraph } from '@/lib/teaching/claimGraph'

/** Phase 5 depth helpers: transfer / teach-back / misconceptions / study plan. */
export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })

  const domainId = request.nextUrl.searchParams.get('domain_id')
  const claimId = request.nextUrl.searchParams.get('claim_id')
  const minutes = Number(request.nextUrl.searchParams.get('minutes') ?? '15')

  if (!domainId) {
    return NextResponse.json({ success: false, error: 'domain_id required' }, { status: 400 })
  }

  const admin = createServiceRoleSupabaseClient()
  const graph = await loadDomainGraph(admin, domainId)
  if (!graph) {
    return NextResponse.json({ success: false, error: 'Domain not found' }, { status: 404 })
  }

  const claim =
    (claimId ? graph.claims.find((c) => c.id === claimId) : null) ?? graph.claims[0] ?? null

  return NextResponse.json({
    success: true,
    data: {
      transfer_prompt: claim ? transferCheckPrompt(claim) : null,
      teach_back_prompt: claim ? teachBackPrompt(claim) : null,
      misconception: misconceptionConfrontation(claim),
      study_plan: buildStudyPlan(
        graph.claims.map((c) => c.stem),
        Number.isFinite(minutes) ? minutes : 15,
      ),
    },
  })
}

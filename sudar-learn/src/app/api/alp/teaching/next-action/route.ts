/**
 * ALP — Teaching OS next-action + mastery for embed surfaces.
 */
import { createServiceRoleSupabaseClient } from '@/lib/supabase/server'
import { validateAlpKey, getAlpKeyFromRequest, validateEmbedToken, isUserInOrg } from '@/lib/alp-auth'
import { NextRequest, NextResponse } from 'next/server'
import { pickNextFifteenMinutes, buildClaimSchedulerCandidates } from '@/lib/teaching/scheduler'
import { loadMasteryForUser } from '@/lib/teaching/mastery'
import { computeNextBestActionForUser } from '@/lib/intelligence/nextBestActionEngine'

export async function GET(request: NextRequest) {
  const authHeader = getAlpKeyFromRequest(request)
  let user_id: string | null = null
  let orgId: string | undefined

  if (authHeader?.includes('.')) {
    const payload = validateEmbedToken(authHeader)
    if (payload) user_id = payload.sub
  }
  if (!user_id) {
    const auth = await validateAlpKey(authHeader)
    if (!auth.valid) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    if (auth.orgId) orgId = auth.orgId
  }

  if (!user_id) user_id = request.nextUrl.searchParams.get('user_id')
  if (!user_id) {
    return NextResponse.json({ success: false, error: 'user_id required' }, { status: 400 })
  }

  const admin = createServiceRoleSupabaseClient()
  if (orgId) {
    const inOrg = await isUserInOrg(admin, user_id, orgId)
    if (!inOrg) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 })
    }
  }

  const next = await pickNextFifteenMinutes(admin, user_id)
  const queue = await buildClaimSchedulerCandidates(admin, user_id, { limit: 5 })
  const claimIds = [...new Set(queue.flatMap((c) => c.claim_ids))]
  const mastery = claimIds.length ? await loadMasteryForUser(admin, user_id, claimIds) : []

  const nba = await computeNextBestActionForUser(admin, user_id, { force: false }).catch(() => null)
  const next_best_action = nba && 'action' in nba ? (nba.action ?? null) : null

  return NextResponse.json({ success: true, data: { next, queue, mastery, next_best_action } })
}

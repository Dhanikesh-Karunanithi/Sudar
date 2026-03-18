/**
 * ALP — Next-best action for external LMS (SudarRecommend).
 * Auth: x-alp-api-key or Authorization: Bearer (env ALP_API_KEY or org key from integration_api_keys).
 * Body: { user_id: string }. Returns stored next_best_action for that user.
 * When using an org-scoped key (integration_api_keys), user_id must be a member of that org.
 * See docs/ALP_API.md.
 */
import { createAdminClient } from '@/lib/supabase/server'
import { validateAlpKey, getAlpKeyFromRequest, validateEmbedToken, isUserInOrg } from '@/lib/alp-auth'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  const authHeader = getAlpKeyFromRequest(request)
  let user_id: string | null = null
  let orgId: string | undefined

  if (authHeader?.includes('.')) {
    const payload = validateEmbedToken(authHeader)
    if (payload) user_id = payload.sub
  }
  if (!user_id) {
    const auth = await validateAlpKey(authHeader)
    if (!auth.valid) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (auth.valid && auth.orgId) orgId = auth.orgId
  }

  let body: { user_id?: string }
  try {
    body = await request.json()
  } catch {
    body = {}
  }
  if (!user_id) user_id = body.user_id ?? null
  if (!user_id) return NextResponse.json({ error: 'user_id required' }, { status: 400 })

  const admin = createAdminClient()
  if (orgId) {
    const inOrg = await isUserInOrg(admin, user_id, orgId)
    if (!inOrg) return NextResponse.json({ error: 'Forbidden: user not in key organisation' }, { status: 403 })
  }

  const { data: profile } = await admin
    .from('learner_profiles')
    .select('next_best_action')
    .eq('user_id', user_id)
    .single()

  const action = profile?.next_best_action as Record<string, unknown> | null
  if (action && typeof action === 'object') {
    return NextResponse.json({
      action_type: action.type ?? 'continue_course',
      target_id: action.course_id ?? action.target_id ?? '',
      reason: action.reason ?? 'Continue your learning.',
      confidence: typeof action.score === 'number' ? action.score / 100 : 0.8,
      ...action,
    })
  }

  return NextResponse.json({
    action_type: 'start_new',
    target_id: '',
    reason: 'Continue your learning.',
    confidence: 0.5,
  })
}

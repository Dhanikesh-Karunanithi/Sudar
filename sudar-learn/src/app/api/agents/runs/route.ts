/**
 * BFF: Sudar Agents runs — forwards to Intelligence with learner JWT.
 */
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { intelligenceBaseUrl } from '@/lib/intelligence/baseUrl'
import { loadLearnerAgentsAccess, learnerRunBlockedReason } from '@/lib/org/sudarAgentsAccess'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

const bodySchema = z.object({
  goal_kind: z.enum(['week_plan', 'remediation', 'path_health', 'spacing_digest', 'custom']).optional(),
  goal: z.string().max(4000).optional(),
  force_nba_refresh: z.boolean().optional(),
  policy_pack_id: z.string().max(64).optional(),
})

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const {
    data: { session },
  } = await supabase.auth.getSession()
  if (!session?.access_token || !session.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const parsed = bodySchema.safeParse(await request.json().catch(() => ({})))
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const admin = createAdminClient()
  const access = await loadLearnerAgentsAccess(admin, session.user.id)
  if (!access) {
    return NextResponse.json(
      { error: 'Sudar Agents require an organisation membership. Contact your administrator.' },
      { status: 403 },
    )
  }
  const goalKind = parsed.data.goal_kind ?? 'week_plan'
  const block = learnerRunBlockedReason(access, goalKind)
  if (block) {
    return NextResponse.json({ error: block }, { status: 403 })
  }

  const base = intelligenceBaseUrl()
  if (!base) {
    return NextResponse.json({ error: 'Sudar Intelligence is not configured' }, { status: 503 })
  }

  const headers: Record<string, string> = {
    Authorization: `Bearer ${session.access_token}`,
    'Content-Type': 'application/json',
  }

  const intelligenceBody = {
    team: 'learner' as const,
    actor_user_id: session.user.id,
    user_id: session.user.id,
    goal_kind: goalKind,
    goal: parsed.data.goal,
    force_nba_refresh: parsed.data.force_nba_refresh === true,
    policy_pack_id: parsed.data.policy_pack_id ?? access.resolved.policy_pack_id,
    org_id: access.orgId,
    path_id: null,
  }

  try {
    const res = await fetch(`${base}/api/agents/runs`, {
      method: 'POST',
      headers,
      body: JSON.stringify(intelligenceBody),
    })
    const text = await res.text()
    return new NextResponse(text, {
      status: res.status,
      headers: { 'Content-Type': res.headers.get('content-type') || 'application/json' },
    })
  } catch {
    return NextResponse.json({ error: 'Intelligence unreachable' }, { status: 502 })
  }
}

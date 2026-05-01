/**
 * BFF: streamed Sudar Agents run (SSE from Intelligence).
 */
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { sudarIntelligenceBaseUrl } from '@/lib/intelligence/baseUrl'
import { loadLearnerAgentsAccess, learnerRunBlockedReason } from '@/lib/org/sudarAgentsAccess'
import { NextRequest } from 'next/server'
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
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const parsed = bodySchema.safeParse(await request.json().catch(() => ({})))
  if (!parsed.success) {
    return new Response(JSON.stringify({ error: 'Invalid JSON' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const admin = createAdminClient()
  const access = await loadLearnerAgentsAccess(admin, session.user.id)
  if (!access) {
    return new Response(
      JSON.stringify({ error: 'Sudar Agents require an organisation membership.' }),
      { status: 403, headers: { 'Content-Type': 'application/json' } },
    )
  }
  const goalKind = parsed.data.goal_kind ?? 'week_plan'
  const block = learnerRunBlockedReason(access, goalKind)
  if (block) {
    return new Response(JSON.stringify({ error: block }), {
      status: 403,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const base = sudarIntelligenceBaseUrl()
  if (!base) {
    return new Response(JSON.stringify({ error: 'Sudar Intelligence is not configured' }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' },
    })
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
    const upstream = await fetch(`${base}/api/agents/runs/stream`, {
      method: 'POST',
      headers,
      body: JSON.stringify(intelligenceBody),
    })
    if (!upstream.ok || !upstream.body) {
      const t = await upstream.text()
      return new Response(t, {
        status: upstream.status,
        headers: { 'Content-Type': 'application/json' },
      })
    }
    return new Response(upstream.body, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache, no-transform',
        Connection: 'keep-alive',
      },
    })
  } catch {
    return new Response(JSON.stringify({ error: 'Intelligence unreachable' }), {
      status: 502,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}

/**
 * Studio BFF: admin_team Sudar Agent runs → Intelligence gateway.
 */
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { requireOrgAdmin } from '@/lib/org'
import { resolveSudarAgentsFromOrgSettings } from '../../../../../../shared/sudarAgentsOrgSettings'
import { sudarIntelligenceBaseUrl } from '@/lib/intelligence/baseUrl'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

const bodySchema = z.object({
  goal_kind: z.enum(['week_plan', 'remediation', 'path_health', 'spacing_digest', 'custom']).optional(),
  goal: z.string().max(4000).optional(),
  path_id: z.string().uuid().optional(),
  policy_pack_id: z.string().max(64).optional(),
})

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let orgId: string
  try {
    orgId = await requireOrgAdmin(user.id)
  } catch {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const {
    data: { session },
  } = await supabase.auth.getSession()
  if (!session?.access_token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const parsed = bodySchema.safeParse(await request.json().catch(() => ({})))
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const admin = createAdminClient()
  const { data: orgRow } = await admin.from('organisations').select('settings').eq('id', orgId).maybeSingle()
  const agentsResolved = resolveSudarAgentsFromOrgSettings(
    (orgRow?.settings as Record<string, unknown>) ?? {},
  )
  if (!agentsResolved.enabled) {
    return NextResponse.json(
      { error: 'Sudar Agents are turned off for your organisation. Ask an admin to enable them in Org settings.' },
      { status: 403 },
    )
  }
  const goalKind = parsed.data.goal_kind ?? 'path_health'
  if (goalKind === 'path_health' && !agentsResolved.features.cohort_pulse) {
    return NextResponse.json(
      { error: 'The cohort pulse (path health) feature is disabled for your organisation.' },
      { status: 403 },
    )
  }

  const base = sudarIntelligenceBaseUrl()
  if (!base) {
    return NextResponse.json({ error: 'Sudar Intelligence is not configured' }, { status: 503 })
  }

  const headers: Record<string, string> = {
    Authorization: `Bearer ${session.access_token}`,
    'Content-Type': 'application/json',
  }

  const intelligenceBody = {
    team: 'admin' as const,
    actor_user_id: user.id,
    org_id: orgId,
    goal_kind: goalKind,
    goal: parsed.data.goal,
    path_id: parsed.data.path_id ?? null,
    policy_pack_id: parsed.data.policy_pack_id ?? agentsResolved.policy_pack_id,
    user_id: null,
    force_nba_refresh: false,
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

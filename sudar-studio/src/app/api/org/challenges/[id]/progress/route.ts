import { NextResponse } from 'next/server'
import { createClient, createServiceRoleSupabaseClient } from '@/lib/supabase/server'

const ADMIN_ROLES = ['ORG_ADMIN', 'SUPER_ADMIN', 'MANAGER']
type OrgChallengeRow = {
  id: string
  org_id: string
  title: string
  challenge_type: string
  target_config: Record<string, unknown> | null
  coin_prize: number | null
  start_at: string
  end_at: string
}
type OrgChallengeProgressRow = {
  id: string
  user_id: string
  contribution: Record<string, unknown> | null
  completed_at: string | null
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const admin = createServiceRoleSupabaseClient()
  const { data: profile } = await admin
    .from('profiles')
    .select('org_id, role')
    .eq('id', user.id)
    .single()

  if (!profile?.org_id || !ADMIN_ROLES.includes(profile.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { data: challengeRaw } = await admin
    .from('org_challenges')
    .select('id, org_id, title, challenge_type, target_config, coin_prize, start_at, end_at')
    .eq('id', id)
    .single()
  const challenge = challengeRaw as unknown as OrgChallengeRow | null

  if (!challenge || challenge.org_id !== profile.org_id) {
    return NextResponse.json({ error: 'Challenge not found' }, { status: 404 })
  }

  const { data: rowsRaw } = await admin
    .from('org_challenge_progress')
    .select('id, user_id, contribution, completed_at')
    .eq('challenge_id', id)
  const rows = rowsRaw as unknown as OrgChallengeProgressRow[] | null

  const userIds = (rows ?? []).map((r) => r.user_id)
  const { data: members } = userIds.length
    ? await admin.from('profiles').select('id, full_name').in('id', userIds)
    : { data: [] as Array<{ id: string; full_name: string | null }> }

  const memberMap = new Map((members ?? []).map((m) => [m.id, m.full_name]))
  const participants = (rows ?? []).map((row) => ({
    id: row.id,
    userId: row.user_id,
    name: memberMap.get(row.user_id) ?? null,
    contribution: row.contribution ?? {},
    completedAt: row.completed_at,
  }))

  return NextResponse.json({
    success: true,
    data: {
      challenge,
      participants,
      participantCount: participants.length,
      completedCount: participants.filter((p) => !!p.completedAt).length,
    },
  })
}


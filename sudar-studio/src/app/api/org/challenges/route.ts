/**
 * GET  /api/org/challenges — list org challenges
 * POST /api/org/challenges — create a new org challenge
 */

import { createClient, createAdminClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

const ADMIN_ROLES = ['ORG_ADMIN', 'SUPER_ADMIN', 'MANAGER']
type OrgChallengeProgressSummaryRow = {
  id: string
  contribution: Record<string, unknown> | null
  completed_at: string | null
}

const createSchema = z.object({
  title: z.string().min(3).max(120),
  description: z.string().max(500).optional().nullable(),
  challengeType: z.enum([
    'individual_completions',
    'team_total_completions',
    'compliance_deadline',
    'streak_leaders',
    'quiz_score_avg',
  ]),
  targetConfig: z.record(z.string(), z.unknown()).optional().default({}),
  coinPrize: z.number().int().min(0).max(10000).optional().default(0),
  startAt: z.string().datetime(),
  endAt: z.string().datetime(),
})

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const admin = createAdminClient()
  const { data: profile } = await admin.from('profiles').select('org_id, role').eq('id', user.id).single()
  if (!profile?.org_id || !ADMIN_ROLES.includes(profile.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { data: challengesRaw } = await admin
    .from('org_challenges')
    .select('*')
    .eq('org_id', profile.org_id)
    .order('created_at', { ascending: false })
  const challenges = challengesRaw as Array<{ id: string } & Record<string, unknown>> | null

  // Add progress counts
  const enriched = await Promise.all((challenges ?? []).map(async (ch) => {
    const { data: progressRowsRaw, count: participantCount } = await admin
      .from('org_challenge_progress')
      .select('id, contribution, completed_at', { count: 'exact' })
      .eq('challenge_id', ch.id)
    const progressRows = progressRowsRaw as unknown as OrgChallengeProgressSummaryRow[] | null

    const completedCount = (progressRows ?? []).filter((row) => !!row.completed_at).length
    const teamProgress = (progressRows ?? []).reduce((sum, row) => {
      const contribution = (row.contribution as Record<string, unknown>) ?? {}
      return sum + (typeof contribution.count === 'number' ? contribution.count : 0)
    }, 0)

    return {
      ...ch,
      participantCount: participantCount ?? 0,
      completedCount,
      teamProgress,
    }
  }))

  return NextResponse.json({ success: true, data: enriched })
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let body: unknown
  try { body = await request.json() } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }
  const parsed = createSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: 'Invalid body', issues: parsed.error.issues }, { status: 400 })

  const admin = createAdminClient()
  const { data: profile } = await admin.from('profiles').select('org_id, role').eq('id', user.id).single()
  if (!profile?.org_id || !ADMIN_ROLES.includes(profile.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { title, description, challengeType, targetConfig, coinPrize, startAt, endAt } = parsed.data

  const { data: challenge, error } = await (admin as unknown as {
    from: (table: string) => { insert: (values: Record<string, unknown>) => { select: () => { single: () => Promise<{ data: Record<string, unknown> | null; error: { message: string } | null }> } } }
  }).from('org_challenges').insert({
    org_id: profile.org_id,
    title,
    description: description ?? null,
    challenge_type: challengeType,
    target_config: targetConfig,
    coin_prize: coinPrize,
    start_at: startAt,
    end_at: endAt,
    created_by: user.id,
  }).select().single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ success: true, data: challenge }, { status: 201 })
}

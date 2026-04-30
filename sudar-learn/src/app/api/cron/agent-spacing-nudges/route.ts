/**
 * Scheduled retrieval / spacing reminders (policy-driven heuristics).
 * Auth: CRON_SECRET via Authorization Bearer or ?secret=
 */
import { createAdminClient } from '@/lib/supabase/server'
import { rejectInvalidCronRequest } from '@/lib/security/cronAuth'
import { defaultSpacingCronConfig } from '@/lib/agents/defaultPolicyPack'
import {
  resolveSudarAgentsFromOrgSettings,
  resolveSudarAgentsLearnerPrefs,
} from '../../../../../../shared/sudarAgentsOrgSettings'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  const invalid = rejectInvalidCronRequest(request)
  if (invalid) return invalid

  const cfg = defaultSpacingCronConfig()
  const admin = createAdminClient()

  const since = new Date()
  since.setDate(since.getDate() - 7)

  const { data: dailyRows } = await admin
    .from('analytics_daily_user')
    .select('user_id, org_id, quiz_attempts, event_date')
    .gte('event_date', since.toISOString().slice(0, 10))

  const keyed = new Map<string, { org_id: string; quiz_attempts: number }>()
  for (const row of dailyRows ?? []) {
    const uid = row.user_id as string
    const oid = row.org_id as string
    const q = Number(row.quiz_attempts ?? 0)
    const prev = keyed.get(uid)
    if (!prev) keyed.set(uid, { org_id: oid, quiz_attempts: q })
    else keyed.set(uid, { org_id: prev.org_id, quiz_attempts: prev.quiz_attempts + q })
  }

  const candidates = [...keyed.entries()]
    .filter(([, v]) => v.quiz_attempts >= cfg.quizAttemptsThreshold)
    .slice(0, cfg.maxNotificationsPerRun)

  const orgResolvedCache = new Map<string, ReturnType<typeof resolveSudarAgentsFromOrgSettings>>()
  async function orgAgentsFor(orgId: string) {
    let r = orgResolvedCache.get(orgId)
    if (!r) {
      const { data: row } = await admin.from('organisations').select('settings').eq('id', orgId).maybeSingle()
      r = resolveSudarAgentsFromOrgSettings((row?.settings as Record<string, unknown>) ?? {})
      orgResolvedCache.set(orgId, r)
    }
    return r
  }

  let inserted = 0
  for (const [user_id, meta] of candidates) {
    const orgAr = await orgAgentsFor(meta.org_id)
    if (!orgAr.enabled || !orgAr.features.spacing_nudges) continue

    const { data: lpRow } = await admin
      .from('learner_profiles')
      .select('ai_tutor_context')
      .eq('user_id', user_id)
      .maybeSingle()
    const prefsRoot =
      lpRow?.ai_tutor_context &&
      typeof lpRow.ai_tutor_context === 'object' &&
      lpRow.ai_tutor_context !== null &&
      !Array.isArray(lpRow.ai_tutor_context)
        ? (((lpRow.ai_tutor_context as Record<string, unknown>).preferences as Record<string, unknown> | undefined) ??
            {})
        : {}
    const learnerSa = resolveSudarAgentsLearnerPrefs(prefsRoot)
    if (!learnerSa.spacing_nudges) continue

    const { data: recent } = await admin
      .from('user_notifications')
      .select('id')
      .eq('user_id', user_id)
      .eq('category', 'agent_spacing')
      .gte('created_at', new Date(Date.now() - cfg.minGapDaysBetweenNudges * 86400000).toISOString())
      .limit(1)

    if (recent && recent.length > 0) continue

    const { error } = await admin.from('user_notifications').insert({
      user_id,
      category: 'agent_spacing',
      title: 'Quick retrieval sprint',
      body:
        'A short recap session reinforces what you practiced this week — open Sudar and retry one quiz or summary.',
      metadata: {
        agent: 'retrieve_space_v1',
        org_id: meta.org_id,
        policy_pack: 'default',
      },
    })

    if (!error) inserted += 1
  }

  return NextResponse.json({ ok: true, candidates: candidates.length, inserted })
}

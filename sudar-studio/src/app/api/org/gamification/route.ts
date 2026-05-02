/**
 * GET /api/org/gamification
 * Returns the Academy Health Score and top learners for the org.
 * Studio admin only.
 */

import { createClient, createServiceRoleSupabaseClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

function clamp(n: number, lo: number, hi: number) { return Math.max(lo, Math.min(hi, n)) }

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const admin = createServiceRoleSupabaseClient()

  const { data: profile } = await admin
    .from('profiles')
    .select('org_id, role')
    .eq('id', user.id)
    .single()

  if (!profile?.org_id || !['ORG_ADMIN', 'SUPER_ADMIN', 'MANAGER', 'CREATOR'].includes(profile.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const orgId = profile.org_id

  // Get all org members
  const { data: orgMembers } = await admin
    .from('profiles')
    .select('id, full_name')
    .eq('org_id', orgId)

  const memberIds = (orgMembers ?? []).map((m) => m.id)
  if (memberIds.length === 0) {
    return NextResponse.json({ success: true, data: { healthScore: 0, grade: 'F', topLearners: [], challengeCount: 0 } })
  }

  const nameMap = new Map((orgMembers ?? []).map((m) => [m.id, m.full_name]))

  // Learner profiles for all members
  const { data: lpRows } = await admin
    .from('learner_profiles')
    .select('user_id, avg_completion_rate, streak_days, overall_engagement_score, xp_total, scholar_level, scholar_title')
    .in('user_id', memberIds)

  // Quiz scores this month
  const monthStart = new Date()
  monthStart.setDate(1)
  monthStart.setHours(0, 0, 0, 0)

  const { data: quizEvents } = await admin
    .from('learning_events')
    .select('user_id, payload')
    .in('user_id', memberIds)
    .eq('event_type', 'quiz_attempt')
    .gte('created_at', monthStart.toISOString())

  const quizByUser: Record<string, number[]> = {}
  for (const ev of quizEvents ?? []) {
    const score = (ev.payload as Record<string, unknown>)?.score as number
    if (typeof score === 'number') {
      if (!quizByUser[ev.user_id]) quizByUser[ev.user_id] = []
      quizByUser[ev.user_id]!.push(score)
    }
  }

  // Weekly active learners
  const weekStart = new Date()
  weekStart.setHours(0, 0, 0, 0)
  weekStart.setDate(weekStart.getDate() - weekStart.getDay())

  const { data: weeklyActive } = await admin
    .from('learning_events')
    .select('user_id')
    .in('user_id', memberIds)
    .gte('created_at', weekStart.toISOString())

  const activeThisWeek = new Set((weeklyActive ?? []).map((e) => e.user_id))
  const weeklyActiveRatio = memberIds.length > 0 ? activeThisWeek.size / memberIds.length : 0

  // Compliance certs
  const { count: totalCerts } = await admin
    .from('enrollments')
    .select('id', { count: 'exact', head: true })
    .in('user_id', memberIds)
    .not('path_id', 'is', null)

  const { count: completedCerts } = await admin
    .from('enrollments')
    .select('id', { count: 'exact', head: true })
    .in('user_id', memberIds)
    .not('path_id', 'is', null)
    .eq('status', 'completed')

  const certRatio = (totalCerts ?? 0) > 0 ? (completedCerts ?? 0) / (totalCerts ?? 1) : 1

  // Aggregate metrics
  const lps = lpRows ?? []
  const avgCompletion = lps.length > 0 ? lps.reduce((s, lp) => s + (lp.avg_completion_rate ?? 0), 0) / lps.length : 0
  const avgStreak = lps.length > 0 ? lps.reduce((s, lp) => s + Math.min(lp.streak_days ?? 0, 30), 0) / lps.length : 0
  const avgEngagement = lps.length > 0 ? lps.reduce((s, lp) => s + (lp.overall_engagement_score ?? 0), 0) / lps.length : 0

  const allQuizScores = Object.values(quizByUser).flat()
  const avgQuiz = allQuizScores.length > 0 ? allQuizScores.reduce((a, b) => a + b, 0) / allQuizScores.length / 100 : 0.5

  const healthScore = clamp(
    (avgCompletion * 0.35 + (avgStreak / 30) * 0.15 + avgQuiz * 0.25 + weeklyActiveRatio * 0.15 + certRatio * 0.10) * 100,
    0, 100
  )

  const grade = healthScore >= 90 ? 'A' : healthScore >= 80 ? 'B' : healthScore >= 70 ? 'C' : healthScore >= 60 ? 'D' : 'F'

  // Top learners by XP
  const topLearners = lps
    .sort((a, b) => (b.xp_total ?? 0) - (a.xp_total ?? 0))
    .slice(0, 10)
    .map((lp, i) => ({
      rank: i + 1,
      userId: lp.user_id,
      name: nameMap.get(lp.user_id) ?? null,
      xp: lp.xp_total ?? 0,
      level: lp.scholar_level ?? 1,
      title: lp.scholar_title ?? 'Seeker',
      engagement: Math.round((lp.overall_engagement_score ?? 0) * 100),
    }))

  // Active challenges count
  const { count: challengeCount } = await admin
    .from('org_challenges')
    .select('id', { count: 'exact', head: true })
    .eq('org_id', orgId)
    .gte('end_at', new Date().toISOString())

  return NextResponse.json({
    success: true,
    data: {
      healthScore: Math.round(healthScore),
      grade,
      memberCount: memberIds.length,
      activeThisWeek: activeThisWeek.size,
      avgCompletionRate: Math.round(avgCompletion * 100),
      avgQuizScore: Math.round(avgQuiz * 100),
      weeklyActiveRatio: Math.round(weeklyActiveRatio * 100),
      certComplianceRatio: Math.round(certRatio * 100),
      topLearners,
      challengeCount: challengeCount ?? 0,
    },
  })
}

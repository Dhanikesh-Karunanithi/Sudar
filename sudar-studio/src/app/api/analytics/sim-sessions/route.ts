import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

type SessionRow = {
  id: string
  user_id: string
  scenario_id: string
  status: string
  started_at: string
  sim_rubric_results:
    | { overall_score: number; passed: boolean; dimension_scores: Record<string, number> }
    | { overall_score: number; passed: boolean; dimension_scores: Record<string, number> }[]
    | null
}

/** Org SudarSim analytics — pass rates, attempts, per-skill scores, transcript drill-down */
export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const admin = (await import('@/lib/supabase/server')).createServiceRoleSupabaseClient()
  const { data: profile } = await admin.from('profiles').select('org_id, role').eq('id', user.id).single()
  if (!profile?.org_id) return NextResponse.json({ error: 'No org' }, { status: 403 })

  const scenarioId = request.nextUrl.searchParams.get('scenario_id')
  const sessionId = request.nextUrl.searchParams.get('session_id')

  if (sessionId) {
    const { data: session } = await admin
      .from('sim_sessions')
      .select('id, user_id, scenario_id, status, started_at, ended_at')
      .eq('id', sessionId)
      .eq('org_id', profile.org_id)
      .single()
    if (!session) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const { data: transcript } = await admin
      .from('sim_transcripts')
      .select('turns')
      .eq('session_id', sessionId)
      .single()
    const { data: rubric } = await admin.from('sim_rubric_results').select('*').eq('session_id', sessionId).single()

    return NextResponse.json({
      success: true,
      session,
      transcript: transcript?.turns ?? [],
      rubric_result: rubric ?? null,
    })
  }

  let query = admin
    .from('sim_sessions')
    .select(
      'id, user_id, scenario_id, status, started_at, sim_rubric_results(overall_score, passed, dimension_scores)',
    )
    .eq('org_id', profile.org_id)
    .order('started_at', { ascending: false })
    .limit(200)

  if (scenarioId) query = query.eq('scenario_id', scenarioId)

  const { data: sessions } = await query

  const rows = (sessions ?? []) as SessionRow[]
  const completed = rows.filter((s) => s.status === 'completed')
  const scores = completed
    .map((s) => {
      const r = Array.isArray(s.sim_rubric_results) ? s.sim_rubric_results[0] : s.sim_rubric_results
      return r?.overall_score
    })
    .filter((n): n is number => typeof n === 'number')

  const passCount = completed.filter((s) => {
    const r = Array.isArray(s.sim_rubric_results) ? s.sim_rubric_results[0] : s.sim_rubric_results
    return Boolean(r?.passed)
  }).length

  const avgScore = scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0
  const passRate = completed.length ? Math.round((passCount / completed.length) * 100) : 0

  const byScenario: Record<
    string,
    { attempts: number; passed: number; avg_score: number; scores: number[] }
  > = {}
  for (const s of completed) {
    const r = Array.isArray(s.sim_rubric_results) ? s.sim_rubric_results[0] : s.sim_rubric_results
    const score = r?.overall_score ?? 0
    const bucket = byScenario[s.scenario_id] ?? { attempts: 0, passed: 0, avg_score: 0, scores: [] }
    bucket.attempts += 1
    if (r?.passed) bucket.passed += 1
    bucket.scores.push(score)
    byScenario[s.scenario_id] = bucket
  }
  const scenarioStats = Object.entries(byScenario).map(([id, stat]) => ({
    scenario_id: id,
    attempts: stat.attempts,
    pass_rate: stat.attempts ? Math.round((stat.passed / stat.attempts) * 100) : 0,
    avg_score: stat.scores.length
      ? Math.round(stat.scores.reduce((a, b) => a + b, 0) / stat.scores.length)
      : 0,
  }))

  const dimensionTotals: Record<string, { sum: number; count: number }> = {}
  for (const s of completed) {
    const r = Array.isArray(s.sim_rubric_results) ? s.sim_rubric_results[0] : s.sim_rubric_results
    const dims = r?.dimension_scores ?? {}
    for (const [key, val] of Object.entries(dims)) {
      const bucket = dimensionTotals[key] ?? { sum: 0, count: 0 }
      bucket.sum += Number(val)
      bucket.count += 1
      dimensionTotals[key] = bucket
    }
  }
  const dimensionAverages = Object.fromEntries(
    Object.entries(dimensionTotals).map(([k, v]) => [k, v.count ? Math.round(v.sum / v.count) : 0]),
  )

  const byLearner: Record<string, number[]> = {}
  for (const s of completed) {
    const r = Array.isArray(s.sim_rubric_results) ? s.sim_rubric_results[0] : s.sim_rubric_results
    if (typeof r?.overall_score !== 'number') continue
    const list = byLearner[s.user_id] ?? []
    list.push(r.overall_score)
    byLearner[s.user_id] = list
  }
  const improvementTrends = Object.entries(byLearner)
    .filter(([, scores]) => scores.length >= 2)
    .map(([user_id, scores]) => ({
      user_id,
      first_score: scores[scores.length - 1],
      latest_score: scores[0],
      delta: scores[0] - scores[scores.length - 1],
      attempts: scores.length,
    }))

  return NextResponse.json({
    success: true,
    summary: {
      total_sessions: rows.length,
      completed_sessions: completed.length,
      avg_score: avgScore,
      pass_rate: passRate,
      dimension_averages: dimensionAverages,
    },
    scenario_stats: scenarioStats,
    improvement_trends: improvementTrends,
    sessions: rows,
  })
}

import { createClient, createAdminClient } from '@/lib/supabase/server'
import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { getOrCreateOrg } from '@/lib/org'
import {
  BarChart2, Users, BookOpen, CheckCircle2, TrendingUp,
  Clock, Brain, AlertTriangle, Zap
} from 'lucide-react'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { CourseTimeSection } from '@/components/analytics/CourseTimeSection'
import { DateRangeFilter } from '@/components/analytics/DateRangeFilter'

export const metadata: Metadata = { title: 'Analytics' }

function pct(n: number, d: number) {
  return d === 0 ? 0 : Math.round((n / d) * 100)
}

function getRangeStart(range: string | undefined): Date | null {
  const now = Date.now()
  const day = 86400000
  if (range === 'week') return new Date(now - 7 * day)
  if (range === 'month') return new Date(now - 30 * day)
  if (range === 'quarter') return new Date(now - 90 * day)
  return null
}

export default async function AnalyticsPage({
  searchParams,
}: {
  searchParams: Promise<{ range?: string }>
}) {
  const { range } = await searchParams
  const rangeStart = getRangeStart(range)

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const admin = createAdminClient()
  const orgId = await getOrCreateOrg(user.id)

  // ── Core data loads ──────────────────────────────────────────────────
  const [
    { data: courses },
    { data: allEnrollments },
    { data: allEvents },
    { data: allLearnerProfiles },
    { data: allProfiles },
  ] = await Promise.all([
    admin.from('courses').select('id, title, difficulty, status').eq('org_id', orgId),
    admin.from('enrollments').select('user_id, course_id, status, progress_pct, created_at, completed_at'),
    admin.from('learning_events').select('user_id, course_id, module_id, event_type, duration_secs, payload, created_at'),
    admin.from('learner_profiles').select('user_id, ai_tutor_context, next_best_action'),
    admin.from('profiles').select('id, full_name, avatar_url'),
  ])

  const orgCourseIds = new Set((courses ?? []).map((c) => c.id))
  let orgEnrollments = (allEnrollments ?? []).filter((e) => e.course_id && orgCourseIds.has(e.course_id))
  let orgEvents = (allEvents ?? []).filter((e) => e.course_id && orgCourseIds.has(e.course_id))

  if (rangeStart) {
    const startStr = rangeStart.toISOString()
    orgEvents = orgEvents.filter((e) => e.created_at >= startStr)
    orgEnrollments = orgEnrollments.filter((e) => (e.created_at ?? '') >= startStr)
  }

  // ── Org-level stats ─────────────────────────────────────────────────
  const totalLearners = new Set(orgEnrollments.map((e) => e.user_id)).size
  const totalEnrollments = orgEnrollments.length
  const completedEnrollments = orgEnrollments.filter((e) => e.status === 'completed').length
  const totalLearningMins = Math.round(
    orgEvents.reduce((s, e) => s + (e.duration_secs ?? 0), 0) / 60
  )
  const aiInteractions = orgEvents.filter((e) => e.event_type === 'ai_tutor_query').length
  const quizAttempts = orgEvents.filter((e) => e.event_type === 'quiz_attempt')
  const avgQuizScore = quizAttempts.length > 0
    ? Math.round(quizAttempts.reduce((s, e) => s + ((e.payload as Record<string,unknown>)?.score as number ?? 0), 0) / quizAttempts.length)
    : null

  // ── Top struggle topics across all learners ──────────────────────────
  const allStruggles: string[] = []
  for (const lp of allLearnerProfiles ?? []) {
    const mem = lp.ai_tutor_context as Record<string, unknown> | null
    const s = (mem?.struggles_with as string[]) ?? []
    allStruggles.push(...s)
  }
  const struggleCounts: Record<string, number> = {}
  for (const s of allStruggles) {
    struggleCounts[s] = (struggleCounts[s] ?? 0) + 1
  }
  const topStruggles = Object.entries(struggleCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)

  // ── Per-course stats ─────────────────────────────────────────────────
  const courseStats = (courses ?? []).map((course) => {
    const ce = orgEnrollments.filter((e) => e.course_id === course.id)
    const done = ce.filter((e) => e.status === 'completed').length
    const qa = orgEvents.filter((e) => e.course_id === course.id && e.event_type === 'quiz_attempt')
    const avgScore = qa.length > 0
      ? Math.round(qa.reduce((s, e) => s + ((e.payload as Record<string,unknown>)?.score as number ?? 0), 0) / qa.length)
      : null
    const wrongTopics: string[] = qa.flatMap((e) => ((e.payload as Record<string,unknown>)?.wrong_topics as string[]) ?? [])
    const topWrong = Object.entries(
      wrongTopics.reduce<Record<string,number>>((acc, t) => { acc[t] = (acc[t] ?? 0) + 1; return acc }, {})
    ).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([t]) => t)

    return { ...course, enrollments: ce.length, completed: done, completionRate: pct(done, ce.length), avgQuizScore: avgScore, topWrongTopics: topWrong }
  }).sort((a, b) => b.enrollments - a.enrollments)

  // ── Per-learner stats ────────────────────────────────────────────────
  const learnerStats = [...new Set(orgEnrollments.map((e) => e.user_id))].map((userId) => {
    const profile = allProfiles?.find((p) => p.id === userId)
    const lp = allLearnerProfiles?.find((l) => l.user_id === userId)
    const mem = lp?.ai_tutor_context as Record<string, unknown> | null
    const ue = orgEnrollments.filter((e) => e.user_id === userId)
    const completedCourses = ue.filter((e) => e.status === 'completed').length
    const inProgress = ue.filter((e) => e.status === 'in_progress' || e.status === 'not_started').length
    const totalMins = Math.round(
      orgEvents.filter((e) => e.user_id === userId).reduce((s, e) => s + (e.duration_secs ?? 0), 0) / 60
    )
    const lastEvent = orgEvents.filter((e) => e.user_id === userId).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0]
    const struggles = (mem?.struggles_with as string[])?.slice(0, 3) ?? []
    const knownConcepts = (mem?.known_concepts as string[])?.length ?? 0
    const interactionCount = (mem?.interaction_count as number) ?? 0

    return {
      userId,
      name: profile?.full_name ?? 'Unknown',
      completedCourses,
      inProgress,
      totalMins,
      struggles,
      knownConcepts,
      interactionCount,
      lastActive: lastEvent?.created_at ?? null,
    }
  }).sort((a, b) => b.totalMins - a.totalMins)

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-10">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <BarChart2 className="w-6 h-6 text-indigo-400" />Analytics
          </h1>
          <p className="text-slate-400 text-sm mt-1">Organisation-wide learning intelligence</p>
        </div>
        <DateRangeFilter />
      </div>

      {/* Org overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Active learners', value: totalLearners, icon: Users, color: 'text-blue-400', bg: 'bg-blue-500/10 border-blue-500/20' },
          { label: 'Courses completed', value: completedEnrollments, icon: CheckCircle2, color: 'text-green-400', bg: 'bg-green-500/10 border-green-500/20' },
          { label: 'Learning minutes', value: totalLearningMins.toLocaleString(), icon: Clock, color: 'text-violet-400', bg: 'bg-violet-500/10 border-violet-500/20' },
          { label: 'Sudar interactions', value: aiInteractions, icon: Brain, color: 'text-orange-400', bg: 'bg-orange-500/10 border-orange-500/20' },
        ].map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className={cn('border rounded-xl p-5 space-y-3', bg)}>
            <div className="flex items-center justify-between">
              <span className="text-slate-400 text-xs font-medium">{label}</span>
              <Icon className={cn('w-4 h-4', color)} />
            </div>
            <p className="text-2xl font-bold text-white">{value}</p>
          </div>
        ))}
      </div>

      {/* Org completion + quiz row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-3">
          <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">Completion rate</p>
          <p className="text-3xl font-bold text-white">{pct(completedEnrollments, totalEnrollments)}<span className="text-lg text-slate-500">%</span></p>
          <div className="w-full bg-slate-800 rounded-full h-2">
            <div className="bg-gradient-to-r from-green-500 to-emerald-400 h-2 rounded-full" style={{ width: `${pct(completedEnrollments, totalEnrollments)}%` }} />
          </div>
          <p className="text-xs text-slate-500">{completedEnrollments} of {totalEnrollments} enrollments completed</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-3">
          <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">Avg quiz score</p>
          {avgQuizScore !== null ? (
            <>
              <p className="text-3xl font-bold text-white">{avgQuizScore}<span className="text-lg text-slate-500">%</span></p>
              <div className="w-full bg-slate-800 rounded-full h-2">
                <div className={cn('h-2 rounded-full', avgQuizScore >= 70 ? 'bg-gradient-to-r from-blue-500 to-indigo-400' : 'bg-gradient-to-r from-orange-500 to-red-400')} style={{ width: `${avgQuizScore}%` }} />
              </div>
              <p className="text-xs text-slate-500">{quizAttempts.length} quiz attempts across all courses</p>
            </>
          ) : (
            <p className="text-slate-500 text-sm">No quizzes completed yet</p>
          )}
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-3">
          <p className="text-xs text-slate-400 font-medium uppercase tracking-wider flex items-center gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5 text-orange-400" />Top org-wide struggles
          </p>
          {topStruggles.length > 0 ? (
            <div className="flex flex-wrap gap-1.5">
              {topStruggles.map(([topic, count]) => (
                <span key={topic} className="text-[11px] px-2 py-1 bg-orange-500/10 text-orange-300 border border-orange-500/20 rounded-full">
                  {topic} <span className="text-orange-500/60">×{count}</span>
                </span>
              ))}
            </div>
          ) : (
            <p className="text-slate-500 text-sm">No struggle data yet</p>
          )}
        </div>
      </div>

      {/* Per-course breakdown */}
      <div className="space-y-4">
        <h2 className="text-sm font-semibold text-white flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-indigo-400" />Course performance
        </h2>
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-800">
                {['Course', 'Status', 'Enrolled', 'Completed', 'Completion', 'Avg Quiz', 'Top Struggles'].map((h) => (
                  <th key={h} className="text-left px-4 py-3 text-xs text-slate-500 font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {courseStats.map((c) => (
                <tr key={c.id} className="hover:bg-slate-800/40 transition-colors">
                  <td className="px-4 py-3">
                    <Link href={`/courses/${c.id}`} className="font-medium text-slate-200 hover:text-indigo-300 transition-colors line-clamp-1">
                      {c.title}
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    <span className={cn('text-xs px-2 py-0.5 rounded-full font-medium',
                      c.status === 'published' ? 'bg-green-500/15 text-green-400' : 'bg-slate-700 text-slate-400'
                    )}>{c.status}</span>
                  </td>
                  <td className="px-4 py-3 text-slate-300 font-medium">{c.enrollments}</td>
                  <td className="px-4 py-3 text-slate-300">{c.completed}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-16 bg-slate-800 rounded-full h-1.5">
                        <div className={cn('h-1.5 rounded-full', c.completionRate >= 60 ? 'bg-green-500' : 'bg-orange-500')} style={{ width: `${c.completionRate}%` }} />
                      </div>
                      <span className="text-xs text-slate-400">{c.completionRate}%</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    {c.avgQuizScore !== null
                      ? <span className={cn('text-xs font-semibold', c.avgQuizScore >= 70 ? 'text-green-400' : 'text-orange-400')}>{c.avgQuizScore}%</span>
                      : <span className="text-xs text-slate-600">—</span>}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {c.topWrongTopics.map((t) => (
                        <span key={t} className="text-[10px] px-1.5 py-0.5 bg-red-500/10 text-red-400 rounded">{t}</span>
                      ))}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {courseStats.length === 0 && (
            <div className="py-12 text-center text-slate-500 text-sm">No course data yet</div>
          )}
        </div>
      </div>

      {/* Per-learner cards */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-white flex items-center gap-2">
            <Users className="w-4 h-4 text-indigo-400" />Learner profiles
          </h2>
          <span className="text-xs text-slate-500">{learnerStats.length} active learner{learnerStats.length !== 1 ? 's' : ''}</span>
        </div>

        {learnerStats.length === 0 ? (
          <div className="bg-slate-900 border border-slate-800 rounded-xl py-12 text-center text-slate-500 text-sm">
            No learners have enrolled yet
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {learnerStats.map((l) => (
              <div key={l.userId} className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center text-white text-sm font-semibold shrink-0">
                    {l.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-white">{l.name}</p>
                    <p className="text-xs text-slate-500">
                      {l.lastActive ? `Active ${new Date(l.lastActive).toLocaleDateString()}` : 'No activity yet'}
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-violet-400">
                    <Zap className="w-3.5 h-3.5" />{l.interactionCount} chats
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  {[
                    { label: 'Completed', value: l.completedCourses, icon: CheckCircle2, color: 'text-green-400' },
                    { label: 'In progress', value: l.inProgress, icon: TrendingUp, color: 'text-blue-400' },
                    { label: 'Mins learned', value: l.totalMins, icon: Clock, color: 'text-slate-400' },
                  ].map(({ label, value, icon: Icon, color }) => (
                    <div key={label} className="bg-slate-800/60 rounded-lg p-2.5 text-center">
                      <Icon className={cn('w-3.5 h-3.5 mx-auto mb-1', color)} />
                      <p className="text-base font-bold text-white">{value}</p>
                      <p className="text-[10px] text-slate-500">{label}</p>
                    </div>
                  ))}
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    {l.struggles.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {l.struggles.map((s) => (
                          <span key={s} className="text-[10px] px-1.5 py-0.5 bg-orange-500/10 text-orange-400 rounded border border-orange-500/20">{s}</span>
                        ))}
                      </div>
                    ) : (
                      <span className="text-[10px] text-slate-600">No struggles recorded</span>
                    )}
                  </div>
                  <div className="flex items-center gap-1 text-[10px] text-slate-500 shrink-0">
                    <Brain className="w-3 h-3 text-violet-500" />{l.knownConcepts} concepts
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Time per section — course selector + learner × module time */}
        <CourseTimeSection courses={courses ?? []} />
      </div>
    </div>
  )
}

import { createClient, createAdminClient } from '@/lib/supabase/server'
import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = { title: 'Learn' }
import { BookOpen, ArrowRight, GraduationCap, CheckCircle2, Flame, Clock, TrendingUp, Zap, Calendar, Route, Lock, ChevronRight, Activity } from 'lucide-react'
import { cn } from '@/lib/utils'
import { headers } from 'next/headers'
import { BentoCard } from '@/components/ui/BentoCard'
import { DashboardSidebar } from '@/components/dashboard/DashboardSidebar'
import { ActivityChartClient } from '@/components/dashboard/ActivityChartClient'
import { Greeting } from '@/components/dashboard/Greeting'
import { SudarLogoMark } from '@/components/branding/SudarLogo'
import { QuestCard } from '@/components/features/gamification/QuestCard'
import { AchievementShelf } from '@/components/features/gamification/AchievementShelf'
import { ProfileCompletenessBar } from '@/components/features/gamification/ProfileCompletenessBar'

function toLocalDateKey(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function toLocalDateKeyFromISO(iso: string): string {
  return toLocalDateKey(new Date(iso))
}

function parseLocalDateKey(key: string): Date {
  const [y, m, d] = key.split('-').map((x) => Number(x))
  return new Date(y, (m ?? 1) - 1, d ?? 1, 0, 0, 0, 0)
}

// Compute streak from local day keys (avoids UTC slicing mismatches).
function computeStreak(dayKeys: string[]): number {
  if (!dayKeys.length) return 0
  const uniqueSorted = [...new Set(dayKeys)].sort() // YYYY-MM-DD lex sort == chronological
  const todayKey = toLocalDateKey(new Date())
  const yesterdayKey = toLocalDateKey(new Date(Date.now() - 86400000))
  const lastKey = uniqueSorted[uniqueSorted.length - 1]
  if (lastKey !== todayKey && lastKey !== yesterdayKey) return 0

  let streak = 1
  for (let i = uniqueSorted.length - 2; i >= 0; i--) {
    const curr = parseLocalDateKey(uniqueSorted[i])
    const next = parseLocalDateKey(uniqueSorted[i + 1])
    const diffDays = Math.round((next.getTime() - curr.getTime()) / 86400000)
    if (diffDays === 1) streak++
    else break
  }
  return streak
}

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const admin = createAdminClient()

  // Auto-create learner profile if it doesn't exist
  const { data: existingProfile } = await admin
    .from('learner_profiles')
    .select('id, ai_tutor_context')
    .eq('user_id', user!.id)
    .single()

  if (!existingProfile) {
    await admin.from('learner_profiles').insert({ user_id: user!.id })
  }

  // Refresh next best action in background (non-blocking)
  const headersList = await headers()
  const cookieHeader = headersList.get('cookie') ?? ''
  const host = headersList.get('host') ?? 'localhost:3001'
  const protocol = process.env.NODE_ENV === 'production' ? 'https' : 'http'
  fetch(`${protocol}://${host}/api/intelligence/next-action`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: cookieHeader },
    body: JSON.stringify({ force: false }),
  }).catch(() => {})
  fetch(`${protocol}://${host}/api/learner/twin-rollup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: cookieHeader },
    body: JSON.stringify({ force: false }),
  }).catch(() => {})

  const today = new Date().toISOString().slice(0, 10)

  const [
    { data: profile },
    { data: learnerProfile },
    { data: enrollments },
    { data: allEvents },
    { data: enrollmentsWithDue },
    { data: lastVisitedEvent },
  ] = await Promise.all([
    admin.from('profiles').select('full_name, org_id').eq('id', user!.id).single(),
    admin.from('learner_profiles').select('ai_tutor_context, next_best_action, coin_balance, xp_total, scholar_level, scholar_title, profile_completeness_pct').eq('user_id', user!.id).single(),
    admin.from('enrollments').select('course_id, status, progress_pct, created_at').eq('user_id', user!.id).order('created_at', { ascending: false }),
    admin.from('learning_events').select('event_type, created_at, duration_secs, module_id').eq('user_id', user!.id).order('created_at', { ascending: false }).limit(500),
    admin.from('enrollments').select('id, course_id, path_id, due_date, status').eq('user_id', user!.id).not('due_date', 'is', null).gte('due_date', today).order('due_date', { ascending: true }).limit(10),
    admin.from('learning_events').select('course_id, module_id, created_at').eq('user_id', user!.id).not('course_id', 'is', null).not('module_id', 'is', null).order('created_at', { ascending: false }).limit(1).maybeSingle(),
  ])

  // Deduplicate by course_id so we never show duplicated course cards
  const courseIds = [...new Set(enrollments?.filter((e) => e.course_id).map((e) => e.course_id as string) ?? [])]
  const pathIds = [...new Set((enrollmentsWithDue ?? []).map((e) => e.path_id).filter(Boolean))]
  const courseIdsDue = [...new Set((enrollmentsWithDue ?? []).map((e) => e.course_id).filter(Boolean))]

  // Required by org: mandatory path enrollments (fetch first so we can batch path title lookups)
  const { data: pathEnrollments } = await admin
    .from('enrollments')
    .select('id, path_id, status, progress_pct')
    .eq('user_id', user!.id)
    .not('path_id', 'is', null)
    .neq('status', 'completed')

  const requiredPathIds = pathEnrollments?.map((e) => e.path_id).filter(Boolean) ?? []
  const allCourseIds = [...new Set([...courseIds, ...courseIdsDue])]
  const allPathIds = [...new Set([...pathIds, ...requiredPathIds])]

  // Single batched fetches for courses and paths
  const [coursesRes, pathsRes] = await Promise.all([
    allCourseIds.length > 0 ? admin.from('courses').select('id, title, description').in('id', allCourseIds) : Promise.resolve({ data: [] }),
    allPathIds.length > 0 ? admin.from('learning_paths').select('id, title, is_mandatory').in('id', allPathIds) : Promise.resolve({ data: [] }),
  ])
  const coursesData = coursesRes.data ?? []
  const pathsData = pathsRes.data ?? []

  const courseMap = new Map(coursesData.map((c) => [c.id, c]))
  const pathMap = new Map(pathsData.map((p) => [p.id, p]))

  let lastVisited: { courseId: string; courseTitle: string; moduleId: string; moduleTitle: string } | null = null
  if (lastVisitedEvent?.course_id && lastVisitedEvent?.module_id) {
    const lvCourseId = lastVisitedEvent.course_id as string
    const lvModuleId = lastVisitedEvent.module_id as string
    const [{ data: lvCourse }, { data: lvModule }] = await Promise.all([
      admin.from('courses').select('id, title').eq('id', lvCourseId).single(),
      admin.from('modules').select('id, title').eq('id', lvModuleId).eq('course_id', lvCourseId).single(),
    ])
    if (lvCourse && lvModule) {
      lastVisited = {
        courseId: lvCourseId,
        courseTitle: lvCourse.title,
        moduleId: lvModuleId,
        moduleTitle: lvModule.title,
      }
    }
  }

  const enrollmentByCourseId = new Map<string, { status: string; progress_pct: number }>()
  for (const e of enrollments ?? []) {
    if (!e.course_id) continue
    const courseId = e.course_id as string
    if (!enrollmentByCourseId.has(courseId)) {
      enrollmentByCourseId.set(courseId, { status: e.status ?? 'not_started', progress_pct: e.progress_pct ?? 0 })
    }
  }

  const enrolledCourses: Array<{ id: string; title: string; description: string | null; progress_pct: number; enrollStatus: string }> = courseIds
    .map((id) => {
      const c = courseMap.get(id)
      const e = enrollmentByCourseId.get(id)
      return c ? { ...c, progress_pct: e?.progress_pct ?? 0, enrollStatus: e?.status ?? 'not_started' } : null
    })
    .filter(Boolean) as Array<{ id: string; title: string; description: string | null; progress_pct: number; enrollStatus: string }>

  const pathTitles: Record<string, string> = Object.fromEntries(pathIds.map((id) => [id, pathMap.get(id)?.title ?? 'Learning path']))
  const courseTitles: Record<string, string> = Object.fromEntries(courseIdsDue.map((id) => [id, courseMap.get(id)?.title ?? 'Course']))

  const upcomingDeadlines = (enrollmentsWithDue ?? [])
    .filter((e) => e.status !== 'completed')
    .map((e) => ({
      id: e.id,
      due_date: e.due_date,
      title: e.path_id ? pathTitles[e.path_id] ?? 'Learning path' : courseTitles[e.course_id!] ?? 'Course',
      href: e.path_id ? `/paths/${e.path_id}` : `/courses/${e.course_id}/learn`,
      isPath: !!e.path_id,
    }))

  const requiredPaths = pathsData.filter((p) => p.is_mandatory).map((p) => ({ id: p.id, title: p.title, is_mandatory: p.is_mandatory }))
  const requiredItems = (pathEnrollments ?? [])
    .filter((e) => requiredPaths.some((p) => p.id === e.path_id))
    .map((e) => {
      const p = requiredPaths.find((x) => x.id === e.path_id)
      return { id: e.id, path_id: e.path_id, title: p?.title ?? 'Path', progress_pct: e.progress_pct }
    })

  // ── Compute real-time stats from events ──────────────────────────
  const eventDayKeys = (allEvents ?? [])
    .map((e) => (e.created_at ? toLocalDateKeyFromISO(e.created_at) : null))
    .filter((k): k is string => !!k)
  const streakDays = computeStreak(eventDayKeys)

  const MAX_SESSION_SECS = 60 * 60
  const cappedEventSecs = (allEvents ?? []).map((e) => Math.min(e.duration_secs ?? 0, MAX_SESSION_SECS))
  const totalSecs = cappedEventSecs.reduce((sum, s) => sum + s, 0)
  const totalMins = Math.round(totalSecs / 60)

  const completed = enrolledCourses.filter((c) => c.enrollStatus === 'completed')
  const inProgress = enrolledCourses.filter((c) => c.enrollStatus !== 'completed')

  // Engagement = ratio of active days in the last 30 days
  const last30Days = new Set((allEvents ?? [])
    .filter((e) => {
      const createdAt = e.created_at
      if (!createdAt) return false
      const diff = (Date.now() - new Date(createdAt).getTime()) / 86400000
      return diff <= 30
    })
    .map((e) => (e.created_at ? toLocalDateKeyFromISO(e.created_at) : null))
    .filter((k): k is string => !!k)
  ).size
  const engagementPct = Math.round((last30Days / 30) * 100)

  // Activity by day for chart (last 7 days)
  const last7DayKeys = Array.from({ length: 7 }, (_, i) => {
    const d = new Date()
    d.setDate(d.getDate() - (6 - i))
    return toLocalDateKey(d)
  })
  const eventDayCounts = (eventDayKeys ?? []).reduce((acc, dayKey) => {
    acc.set(dayKey, (acc.get(dayKey) ?? 0) + 1)
    return acc
  }, new Map<string, number>())
  const countByDay = last7DayKeys.map((dayKey) => {
    const count = eventDayCounts.get(dayKey) ?? 0
    const [y, m, d] = dayKey.split('-').map((x) => Number(x))
    const label = new Date(y, (m ?? 1) - 1, d ?? 1).toLocaleDateString('en-US', { weekday: 'short' })
    return { name: label, count }
  })

  // Period-scoped stats for sidebar (this week, this month, last 30 days)
  const now = Date.now()
  const dayMs = 86400000
  const thisWeekStart = new Date(new Date().setHours(0, 0, 0, 0))
  thisWeekStart.setDate(thisWeekStart.getDate() - thisWeekStart.getDay())
  const thisMonthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1)
  const last30Start = new Date(now - 30 * dayMs)
  const inPeriod = (createdAt: string | null | undefined, periodStart: Date) =>
    createdAt ? new Date(createdAt).getTime() >= periodStart.getTime() : false
  const events = allEvents ?? []
  const safeRound = (n: number) => Math.round(Number(n) || 0)
  const periodStats = {
    thisWeek: {
      totalMins: safeRound(events.filter((e) => inPeriod(e.created_at, thisWeekStart)).reduce((s, e) => s + Math.min(e.duration_secs ?? 0, MAX_SESSION_SECS), 0) / 60),
      sessions: new Set(
        events
          .filter((e) => inPeriod(e.created_at, thisWeekStart))
          .map((e) => (e.created_at ? toLocalDateKeyFromISO(e.created_at) : null))
          .filter((k): k is string => !!k)
      ).size,
      modulesCompleted: new Set(
        events
          .filter((e) => e.event_type === 'module_complete' && inPeriod(e.created_at, thisWeekStart))
          .map((e) => e.module_id)
          .filter((id): id is string => !!id)
      ).size,
    },
    thisMonth: {
      totalMins: safeRound(events.filter((e) => inPeriod(e.created_at, thisMonthStart)).reduce((s, e) => s + Math.min(e.duration_secs ?? 0, MAX_SESSION_SECS), 0) / 60),
      sessions: new Set(
        events
          .filter((e) => inPeriod(e.created_at, thisMonthStart))
          .map((e) => (e.created_at ? toLocalDateKeyFromISO(e.created_at) : null))
          .filter((k): k is string => !!k)
      ).size,
      modulesCompleted: new Set(
        events
          .filter((e) => e.event_type === 'module_complete' && inPeriod(e.created_at, thisMonthStart))
          .map((e) => e.module_id)
          .filter((id): id is string => !!id)
      ).size,
    },
    last30: {
      totalMins: safeRound(events.filter((e) => inPeriod(e.created_at, last30Start)).reduce((s, e) => s + Math.min(e.duration_secs ?? 0, MAX_SESSION_SECS), 0) / 60),
      sessions: new Set(
        events
          .filter((e) => inPeriod(e.created_at, last30Start))
          .map((e) => (e.created_at ? toLocalDateKeyFromISO(e.created_at) : null))
          .filter((k): k is string => !!k)
      ).size,
      modulesCompleted: new Set(
        events
          .filter((e) => e.event_type === 'module_complete' && inPeriod(e.created_at, last30Start))
          .map((e) => e.module_id)
          .filter((id): id is string => !!id)
      ).size,
    },
  }

  // Leaderboard (org-scoped): top learners by learning time this week
  let leaderboard: Array<{
    rank: number
    userId: string
    fullName: string | null
    avatarUrl: string | null
    totalMins: number
    isCurrentUser: boolean
  }> | null = null
  if (profile?.org_id) {
    const { data: orgProfiles } = await admin.from('profiles').select('id').eq('org_id', profile.org_id)
    const orgUserIds = (orgProfiles ?? []).map((p) => p.id)
    if (orgUserIds.length > 0) {
      const { data: orgEvents } = await admin
        .from('learning_events')
        .select('user_id, duration_secs, created_at')
        .in('user_id', orgUserIds)
        .gte('created_at', thisWeekStart.toISOString())
      const minsByUser = (orgEvents ?? []).reduce((acc, e) => {
        const id = e.user_id
        if (!acc[id]) acc[id] = 0
        acc[id] += Math.min(e.duration_secs ?? 0, MAX_SESSION_SECS) / 60
        return acc
      }, {} as Record<string, number>)
      const sorted = Object.entries(minsByUser)
        .map(([userId, totalMins]) => ({ userId, totalMins: Math.round(totalMins) }))
        .sort((a, b) => b.totalMins - a.totalMins)
      const top10 = sorted.slice(0, 10)
      const top10Ids = top10.map((x) => x.userId)
      const includeIds = [...new Set([...top10Ids, user!.id])]
      const { data: names } = await admin.from('profiles').select('id, full_name, avatar_url').in('id', includeIds)
      const nameMap = new Map(
        (names ?? []).map((n) => [
          n.id,
          { name: n.full_name ?? null, avatar: n.avatar_url ?? null },
        ])
      )
      const rankByUser = Object.fromEntries(sorted.map((s, i) => [s.userId, i + 1]))
      leaderboard = top10.map((s, i) => ({
        rank: i + 1,
        userId: s.userId,
        fullName: nameMap.get(s.userId)?.name ?? null,
        avatarUrl: nameMap.get(s.userId)?.avatar ?? null,
        totalMins: s.totalMins,
        isCurrentUser: s.userId === user!.id,
      }))
      if (!leaderboard.some((e) => e.isCurrentUser) && rankByUser[user!.id] != null) {
        leaderboard.push({
          rank: rankByUser[user!.id],
          userId: user!.id,
          fullName: nameMap.get(user!.id)?.name ?? null,
          avatarUrl: nameMap.get(user!.id)?.avatar ?? null,
          totalMins: Math.round(minsByUser[user!.id] ?? 0),
          isCurrentUser: true,
        })
        leaderboard.sort((a, b) => a.rank - b.rank)
      }
    }
  }

  const memory = (learnerProfile?.ai_tutor_context as Record<string, unknown>) ?? {}
  const interactionCount = (memory.interaction_count as number) ?? 0
  const lp = learnerProfile as Record<string, unknown> | null
  const profileCompleteness = (lp?.profile_completeness_pct as number) ?? 0
  const scholarLevel = (lp?.scholar_level as number) ?? 1
  const scholarTitle = (lp?.scholar_title as string) ?? 'Seeker'
  const xpTotal = (lp?.xp_total as number) ?? 0

  const firstName = profile?.full_name?.split(' ')[0] ?? 'there'

  const nba = learnerProfile?.next_best_action as Record<string, unknown> | null
  const focusedTimeWeekMins = Math.max(0, Math.round(periodStats.thisWeek.totalMins * ((learnerProfile?.overall_engagement_score as number | undefined) ?? 0.7)))
  const suggestedSessionMins = Number(nba?.recommended_duration_mins ?? (streakDays > 0 ? 20 : 12))
  const engagementBand =
    engagementPct >= 65 ? 'Strong momentum' : engagementPct >= 35 ? 'Steady progress' : 'Needs consistency'

  // Hero insights: active days this week, last active, next deadline
  const activeDaysThisWeek = periodStats.thisWeek.sessions
  const lastEventDayKey = eventDayKeys[0] ?? null
  const todayKey = toLocalDateKey(new Date())
  const lastActiveLabel = !lastEventDayKey ? null : lastEventDayKey === todayKey ? 'Active today' : (() => {
    const diff = Math.round((Date.now() - parseLocalDateKey(lastEventDayKey).getTime()) / dayMs)
    return diff === 1 ? 'Active yesterday' : `Last active ${diff} days ago`
  })()
  const nextDeadline = upcomingDeadlines[0]

  return (
    <div className="flex flex-col lg:flex-row gap-8 lg:gap-10">
      {/* Left column: hero + KPI + next action + lists */}
      <div className="flex-[2.2] flex flex-col gap-8">
        {/* Hero block — Apple-esque: clean greeting, no emoji, insights row */}
        <section className="hero-block min-h-[280px] flex flex-col justify-between p-6 md:p-10">
          <div className="relative z-10">
            <h1 className="font-display text-3xl md:text-4xl lg:text-5xl font-bold text-card-foreground leading-tight tracking-tighter mb-2">
              <Greeting firstName={firstName} />
            </h1>
            <p className="text-muted-foreground text-base md:text-lg max-w-xl mb-4">
              {nba?.course_title
                ? <>Sudar recommends <span className="font-semibold text-card-foreground underline decoration-primary underline-offset-2">{nba.course_title as string}</span>.</>
                : inProgress.length > 0
                  ? `You have ${inProgress.length} course${inProgress.length !== 1 ? 's' : ''} in progress.`
                  : 'Start learning by enrolling in a course.'}
            </p>
            {/* Insights row: streak, active days, last active, next deadline */}
            <div className="flex flex-wrap items-center gap-2">
              {streakDays > 0 && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-warning/10 text-warning border border-warning/20">
                  <Flame className="w-3 h-3" /> {streakDays}-day streak
                </span>
              )}
              {activeDaysThisWeek > 0 && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary border border-primary/20">
                  {activeDaysThisWeek} active day{activeDaysThisWeek !== 1 ? 's' : ''} this week
                </span>
              )}
              {lastActiveLabel && (
                <span className="px-2.5 py-1 rounded-full text-xs font-medium text-muted-foreground bg-muted border border-border">
                  {lastActiveLabel}
                </span>
              )}
              {nextDeadline && (
                <Link href={nextDeadline.href} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-card border border-border text-card-foreground hover:bg-muted transition-colors">
                  <Calendar className="w-3 h-3" /> Due {new Date(nextDeadline.due_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                </Link>
              )}
            </div>
          </div>
          <div className="relative z-10 flex flex-wrap items-center justify-between gap-4 mt-6">
            {lastVisited && (
              <Link
                href={`/courses/${lastVisited.courseId}/learn?module=${lastVisited.moduleId}`}
                className="flex items-center gap-2 px-4 py-2.5 bg-primary hover:opacity-90 text-primary-foreground text-sm font-medium rounded-button transition-all"
              >
                <BookOpen className="w-4 h-4" /> Continue: {lastVisited.courseTitle} — {lastVisited.moduleTitle}
                <ArrowRight className="w-4 h-4" />
              </Link>
            )}
            <Link href="/courses" className="flex items-center gap-2 px-4 py-2.5 bg-primary hover:opacity-90 text-primary-foreground text-sm font-medium rounded-button transition-all">
              <BookOpen className="w-4 h-4" /> Browse courses
            </Link>
            {nba?.course_id && !lastVisited && (
              <Link href={`/courses/${nba.course_id}`} className="action-button">
                Next Best Action <ChevronRight size={20} />
              </Link>
            )}
          </div>
        </section>
        {/* Scholar rank + profile completeness */}
        {(scholarLevel > 1 || profileCompleteness < 100) && (
          <BentoCard padding="md" className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xl" role="img" aria-hidden>⬡</span>
                <div>
                  <p className="text-sm font-bold text-card-foreground">
                    {scholarTitle}
                    <span className="ml-2 text-xs font-normal text-muted-foreground">Level {scholarLevel}</span>
                  </p>
                  <p className="text-xs text-muted-foreground">{xpTotal.toLocaleString()} XP earned</p>
                </div>
              </div>
            </div>
            {profileCompleteness < 100 && (
              <ProfileCompletenessBar completeness={profileCompleteness} />
            )}
          </BentoCard>
        )}

        {/* Daily quests */}
        <QuestCard />

        {/* KPI row + Activity chart */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Day streak', value: streakDays, suffix: streakDays === 1 ? 'day' : 'days', icon: Flame, color: streakDays > 0 ? 'text-warning' : 'text-muted-foreground' },
            { label: 'Learning time', value: periodStats.thisWeek.totalMins < 60 ? periodStats.thisWeek.totalMins : Math.round(periodStats.thisWeek.totalMins / 60), suffix: periodStats.thisWeek.totalMins < 60 ? 'mins' : 'hrs', icon: Clock, color: 'text-primary' },
            { label: 'Courses done', value: completed.length, suffix: '', icon: CheckCircle2, color: 'text-success' },
            { label: 'Monthly activity', value: engagementPct, suffix: '%', icon: TrendingUp, color: 'text-accent' },
          ].map(({ label, value, suffix, icon: Icon, color }) => (
            <div key={label} className="kpi-card !p-5">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground text-xs font-medium">{label}</span>
                <Icon className={cn('w-4 h-4', color)} />
              </div>
              <p className="text-xl font-bold text-card-foreground mt-1">
                {value}<span className="text-sm font-normal text-muted-foreground ml-1">{suffix}</span>
              </p>
            </div>
          ))}
        </div>

        {/* Personal insights */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <BentoCard padding="md">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Focused time (week)</p>
            <p className="mt-2 text-2xl font-bold text-card-foreground">{focusedTimeWeekMins}<span className="ml-1 text-sm font-medium text-muted-foreground">mins</span></p>
            <p className="mt-1 text-xs text-muted-foreground">Estimated high-quality active time from your recent sessions.</p>
          </BentoCard>
          <BentoCard padding="md">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Engagement</p>
            <p className="mt-2 text-2xl font-bold text-card-foreground">{engagementPct}%</p>
            <p className="mt-1 text-xs text-muted-foreground">{engagementBand}</p>
          </BentoCard>
          <BentoCard padding="md">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Next best session</p>
            <p className="mt-2 text-2xl font-bold text-card-foreground">{suggestedSessionMins}<span className="ml-1 text-sm font-medium text-muted-foreground">mins</span></p>
            <p className="mt-1 text-xs text-muted-foreground">Recommended focus block based on your rhythm and progress.</p>
          </BentoCard>
        </div>

        {/* Activity + Your courses (combined card) — purpose: consistency helps Sudar recommend next steps */}
        <div className="kpi-card min-h-[220px] flex flex-col">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center">
              <Activity className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 className="font-display text-lg font-bold text-card-foreground">Activity</h2>
              <p className="text-muted-foreground text-xs font-semibold uppercase tracking-wider">Last 7 days</p>
            </div>
          </div>
          <div className="h-[140px] w-full flex-shrink-0 flex flex-col">
            <ActivityChartClient data={countByDay} />
          </div>
          {activeDaysThisWeek > 0 && (
            <p className="text-xs text-muted-foreground mt-2 flex-shrink-0">
              You had {activeDaysThisWeek} active day{activeDaysThisWeek !== 1 ? 's' : ''} this week. Consistency helps Sudar recommend what to do next.
            </p>
          )}
          {/* Your courses strip: in-progress + recently completed */}
          {(inProgress.length > 0 || completed.length > 0) && (
            <div className="mt-4 pt-4 border-t border-border flex-shrink-0">
              <p className="text-muted-foreground text-xs font-semibold uppercase tracking-wider mb-2">Your courses</p>
              <div className="flex flex-col gap-2">
                {[...inProgress, ...completed].slice(0, 4).map((course) => (
                  <Link key={course.id} href={`/courses/${course.id}`} className="flex items-center gap-2 group">
                    <span className="flex-1 text-sm font-medium text-card-foreground truncate group-hover:text-primary transition-colors">
                      {course.title}
                    </span>
                    {course.enrollStatus === 'completed' ? (
                      <CheckCircle2 className="w-4 h-4 text-success shrink-0" />
                    ) : (
                      <>
                        <span className="text-xs font-semibold text-primary shrink-0 w-8 text-right">{Math.round(course.progress_pct)}%</span>
                        <div className="w-16 h-1.5 bg-muted rounded-full overflow-hidden shrink-0">
                          <div className="bg-primary h-full rounded-full transition-[width]" style={{ width: `${course.progress_pct}%` }} />
                        </div>
                      </>
                    )}
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Streak motivation */}
        {streakDays >= 1 && (
          <BentoCard padding="md" className="bg-warning/10 border-warning/30 flex items-center gap-3">
            <Flame className="w-5 h-5 text-warning shrink-0" />
            <p className="text-sm text-card-foreground">
              {streakDays >= 7 ? `${streakDays}-day streak — you're on fire! Keep it going.`
                : streakDays >= 3 ? `${streakDays}-day streak! Great consistency.`
                : "You're on a streak! Come back tomorrow to keep it going."}
            </p>
          </BentoCard>
        )}

        {/* Required by organisation */}
        {requiredItems.length > 0 && (
          <BentoCard padding="md" className="border-warning/50 space-y-3">
            <h2 className="text-sm font-semibold text-card-foreground flex items-center gap-2">
              <Lock className="w-4 h-4 text-warning" /> Required by your organisation
            </h2>
            <ul className="space-y-2">
              {requiredItems.map((r) => (
                <li key={r.id}>
                  <Link href={`/paths/${r.path_id}`} className="flex items-center justify-between gap-3 py-2 px-3 rounded-button hover:bg-warning/10 transition-colors group">
                    <div className="flex items-center gap-2 min-w-0">
                      <Route className="w-4 h-4 text-warning shrink-0" />
                      <span className="text-sm font-medium text-card-foreground truncate">{r.title}</span>
                    </div>
                    <span className="text-xs text-muted-foreground shrink-0">{Math.round(r.progress_pct)}%</span>
                    <ArrowRight className="w-3.5 h-3.5 shrink-0" />
                  </Link>
                </li>
              ))}
            </ul>
          </BentoCard>
        )}

        {/* Upcoming deadlines */}
        {upcomingDeadlines.length > 0 && (
          <BentoCard padding="md" className="border-warning/50 space-y-3">
            <h2 className="text-sm font-semibold text-card-foreground flex items-center gap-2">
              <Calendar className="w-4 h-4 text-warning" /> Upcoming deadlines
            </h2>
            <ul className="space-y-2">
              {upcomingDeadlines.map((d) => (
                <li key={d.id}>
                  <Link href={d.href} className="flex items-center justify-between gap-3 py-2 px-3 rounded-button hover:bg-muted transition-colors group">
                    <div className="flex items-center gap-2 min-w-0">
                      {d.isPath ? <Route className="w-4 h-4 text-primary shrink-0" /> : <BookOpen className="w-4 h-4 text-primary shrink-0" />}
                      <span className="text-sm font-medium text-card-foreground truncate">{d.title}</span>
                    </div>
                    <span className="text-xs text-muted-foreground shrink-0">{new Date(d.due_date).toLocaleDateString()}</span>
                    <ArrowRight className="w-3.5 h-3.5 shrink-0" />
                  </Link>
                </li>
              ))}
            </ul>
          </BentoCard>
        )}

        {/* Sudar memory card */}
        {interactionCount > 0 && (
          <BentoCard padding="md" className="bg-primary/5 border-primary/20 flex items-start gap-4">
            <SudarLogoMark className="h-8 w-auto shrink-0 text-primary" starFill="var(--card)" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-card-foreground">
                Sudar has learned from {interactionCount} interaction{interactionCount !== 1 ? 's' : ''} with you
              </p>
              <p className="text-muted-foreground text-xs mt-0.5">
                {(memory.known_concepts as string[] | undefined)?.length
                  ? `Concepts: ${(memory.known_concepts as string[]).slice(0, 3).join(', ')}${(memory.known_concepts as string[]).length > 3 ? '…' : ''}`
                  : 'Keep asking questions!'}
              </p>
            </div>
            <Link href="/memory" className="text-xs font-medium text-primary hover:opacity-90 px-3 py-1.5 rounded-button hover:bg-primary/10 shrink-0">
              View memory →
            </Link>
          </BentoCard>
        )}

        {/* Next best action — Sudar recommends */}
        {nba?.course_id && (
          <BentoCard padding="md" variant="elevated" className="rounded-5xl border-primary/20">
            <div className="flex items-start gap-4">
              <div className="w-11 h-11 rounded-2xl bg-primary flex items-center justify-center shadow-md shrink-0">
                <Zap className="w-5 h-5 text-primary-foreground" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-primary uppercase tracking-wider mb-1">Sudar recommends</p>
                <p className="text-base font-bold text-card-foreground line-clamp-1">{nba.course_title as string}</p>
                <p className="text-sm text-muted-foreground mt-1 leading-relaxed">{nba.reason as string}</p>
                {nba.course_difficulty && (
                  <span className="inline-block mt-2 text-[11px] px-2 py-0.5 bg-primary/10 text-primary rounded-pill font-medium capitalize">
                    {nba.course_difficulty as string}
                  </span>
                )}
              </div>
            </div>
            <Link
              href={`/courses/${nba.course_id}`}
              className="mt-4 flex items-center justify-center gap-2 w-full py-2.5 bg-primary hover:opacity-90 text-primary-foreground text-sm font-semibold rounded-button transition-all"
            >
              <BookOpen className="w-4 h-4" /> Start this course <ArrowRight className="w-4 h-4" />
            </Link>
          </BentoCard>
        )}

        {/* In-progress + empty state */}
        {inProgress.length > 0 && (
          <div className="space-y-3">
            <h2 className="text-base font-semibold text-card-foreground">Continue learning</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {inProgress.map((course) => (
                <Link key={course.id} href={`/courses/${course.id}`}>
                  <BentoCard padding="md" className="hover:border-primary/40 hover:shadow-lg transition-all group">
                    <div className="flex items-start gap-3 mb-4">
                      <div className="w-10 h-10 rounded-card bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
                        <BookOpen className="w-5 h-5 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-semibold text-card-foreground group-hover:text-primary transition-colors line-clamp-2">{course.title}</h3>
                        {course.description && <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{course.description}</p>}
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">Progress</span>
                        <span className="text-xs font-semibold text-primary">{Math.round(course.progress_pct)}%</span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-2">
                        <div className="bg-primary h-2 rounded-full transition-[width]" style={{ width: `${course.progress_pct}%` }} />
                      </div>
                    </div>
                  </BentoCard>
                </Link>
              ))}
            </div>
          </div>
        )}

        {enrolledCourses.length === 0 && (
          <BentoCard padding="lg" variant="elevated" className="rounded-5xl text-center space-y-4 border-primary/10">
            <div className="w-14 h-14 rounded-5xl bg-card border border-border flex items-center justify-center mx-auto">
              <GraduationCap className="w-7 h-7 text-primary" />
            </div>
            <div className="space-y-1.5">
              <h2 className="text-base font-semibold text-card-foreground">No courses yet</h2>
              <p className="text-muted-foreground text-sm">Browse the catalog and enroll in your first course.</p>
            </div>
            <Link href="/courses" className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary hover:opacity-90 text-primary-foreground text-sm font-medium rounded-button shadow-lg">
              <BookOpen className="w-4 h-4" /> Browse courses <ArrowRight className="w-4 h-4" />
            </Link>
          </BentoCard>
        )}

        {completed.length > 0 && (
          <div className="space-y-3">
            <h2 className="text-base font-semibold text-card-foreground flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-success" /> Completed courses
            </h2>
            <BentoCard padding="none" className="overflow-hidden divide-y divide-border">
              {completed.map((course) => (
                <Link key={course.id} href={`/courses/${course.id}`} className="flex items-center gap-3 px-5 py-4 hover:bg-muted transition-colors group">
                  <CheckCircle2 className="w-5 h-5 text-success shrink-0" />
                  <span className="flex-1 text-sm font-medium text-muted-foreground group-hover:text-card-foreground">{course.title}</span>
                  <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-card-foreground" />
                </Link>
              ))}
            </BentoCard>
          </div>
        )}
      </div>

      {/* Right column: Learner sidebar (activity, KPIs, insights, quick links, courses) */}
      <aside className="flex-1 flex flex-col gap-6 min-w-0">
        <DashboardSidebar
          periodStats={periodStats}
          streakDays={streakDays}
          completedCount={completed.length}
          inProgress={inProgress.map((c) => ({ id: c.id, title: c.title, progress_pct: c.progress_pct, enrollStatus: c.enrollStatus }))}
          completed={completed.map((c) => ({ id: c.id, title: c.title, progress_pct: c.progress_pct, enrollStatus: c.enrollStatus }))}
          leaderboard={leaderboard}
        />
        <AchievementShelf />
      </aside>
    </div>
  )
}

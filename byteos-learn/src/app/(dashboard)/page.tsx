import { createClient, createAdminClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { BookOpen, ArrowRight, GraduationCap, CheckCircle2, Flame, Clock, TrendingUp, Bot, Zap, Calendar, Route, Lock } from 'lucide-react'
import { cn } from '@/lib/utils'
import { headers } from 'next/headers'
import { BentoCard } from '@/components/ui/BentoCard'

// Compute streak from event dates
function computeStreak(eventDates: string[]): number {
  if (!eventDates.length) return 0
  const days = [...new Set(eventDates.map((d) => d.slice(0, 10)))].sort().reverse()
  const today = new Date().toISOString().slice(0, 10)
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10)
  if (days[0] !== today && days[0] !== yesterday) return 0
  let streak = 1
  for (let i = 1; i < days.length; i++) {
    const prev = new Date(days[i - 1])
    const curr = new Date(days[i])
    const diff = Math.round((prev.getTime() - curr.getTime()) / 86400000)
    if (diff === 1) streak++
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

  const today = new Date().toISOString().slice(0, 10)

  const [
    { data: profile },
    { data: learnerProfile },
    { data: enrollments },
    { data: allEvents },
    { data: enrollmentsWithDue },
  ] = await Promise.all([
    admin.from('profiles').select('full_name').eq('id', user!.id).single(),
    admin.from('learner_profiles').select('ai_tutor_context, next_best_action').eq('user_id', user!.id).single(),
    admin.from('enrollments').select('course_id, status, progress_pct, created_at').eq('user_id', user!.id).order('created_at', { ascending: false }),
    admin.from('learning_events').select('event_type, created_at, duration_secs').eq('user_id', user!.id).order('created_at', { ascending: false }).limit(200),
    admin.from('enrollments').select('id, course_id, path_id, due_date, status').eq('user_id', user!.id).not('due_date', 'is', null).gte('due_date', today).order('due_date', { ascending: true }).limit(10),
  ])

  const courseIds = enrollments?.map((e) => e.course_id) ?? []
  let enrolledCourses: Array<{ id: string; title: string; description: string | null; progress_pct: number; enrollStatus: string }> = []

  if (courseIds.length > 0) {
    const { data: courses } = await admin.from('courses').select('id, title, description').in('id', courseIds)
    enrolledCourses = courses?.map((c) => {
      const e = enrollments?.find((en) => en.course_id === c.id)
      return { ...c, progress_pct: e?.progress_pct ?? 0, enrollStatus: e?.status ?? 'not_started' }
    }) ?? []
  }

  // ── Compute real-time stats from events ──────────────────────────
  const eventDates = (allEvents ?? []).map((e) => e.created_at)
  const streakDays = computeStreak(eventDates)

  const totalSecs = (allEvents ?? []).reduce((sum, e) => sum + (e.duration_secs ?? 0), 0)
  const totalMins = Math.round(totalSecs / 60)

  const completed = enrolledCourses.filter((c) => c.enrollStatus === 'completed')
  const inProgress = enrolledCourses.filter((c) => c.enrollStatus !== 'completed')

  // Resolve titles for upcoming deadlines
  const pathIds = [...new Set((enrollmentsWithDue ?? []).map((e) => e.path_id).filter(Boolean))]
  const courseIdsDue = [...new Set((enrollmentsWithDue ?? []).map((e) => e.course_id).filter(Boolean))]
  let pathTitles: Record<string, string> = {}
  let courseTitles: Record<string, string> = {}
  if (pathIds.length > 0) {
    const { data: paths } = await admin.from('learning_paths').select('id, title').in('id', pathIds)
    pathTitles = Object.fromEntries((paths ?? []).map((p) => [p.id, p.title]))
  }
  if (courseIdsDue.length > 0) {
    const { data: coursesDue } = await admin.from('courses').select('id, title').in('id', courseIdsDue)
    courseTitles = Object.fromEntries((coursesDue ?? []).map((c) => [c.id, c.title]))
  }
  const upcomingDeadlines = (enrollmentsWithDue ?? [])
    .filter((e) => e.status !== 'completed')
    .map((e) => ({
      id: e.id,
      due_date: e.due_date,
      title: e.path_id ? pathTitles[e.path_id] ?? 'Learning path' : courseTitles[e.course_id!] ?? 'Course',
      href: e.path_id ? `/paths/${e.path_id}` : `/courses/${e.course_id}/learn`,
      isPath: !!e.path_id,
    }))

  // Required by org: mandatory path enrollments not yet completed
  const { data: pathEnrollments } = await admin
    .from('enrollments')
    .select('id, path_id, status, progress_pct')
    .eq('user_id', user!.id)
    .not('path_id', 'is', null)
    .neq('status', 'completed')

  const requiredPathIds = pathEnrollments?.map((e) => e.path_id).filter(Boolean) ?? []
  let requiredPaths: Array<{ id: string; title: string; is_mandatory: boolean }> = []
  if (requiredPathIds.length > 0) {
    const { data: pathsData } = await admin.from('learning_paths').select('id, title, is_mandatory').in('id', requiredPathIds)
    requiredPaths = (pathsData ?? []).filter((p) => p.is_mandatory).map((p) => ({ id: p.id, title: p.title, is_mandatory: p.is_mandatory }))
  }
  const requiredItems = (pathEnrollments ?? [])
    .filter((e) => requiredPaths.some((p) => p.id === e.path_id))
    .map((e) => {
      const p = requiredPaths.find((x) => x.id === e.path_id)
      return { id: e.id, path_id: e.path_id, title: p?.title ?? 'Path', progress_pct: e.progress_pct }
    })

  // Engagement = ratio of active days in the last 30 days
  const last30Days = new Set(eventDates.filter((d) => {
    const diff = (Date.now() - new Date(d).getTime()) / 86400000
    return diff <= 30
  }).map((d) => d.slice(0, 10))).size
  const engagementPct = Math.round((last30Days / 30) * 100)

  const memory = (learnerProfile?.ai_tutor_context as Record<string, unknown>) ?? {}
  const interactionCount = (memory.interaction_count as number) ?? 0

  const firstName = profile?.full_name?.split(' ')[0] ?? 'there'
  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold text-card-foreground">{greeting}, {firstName} 👋</h1>
          <p className="text-muted-foreground text-sm">
            {inProgress.length > 0
              ? `${inProgress.length} course${inProgress.length !== 1 ? 's' : ''} in progress.`
              : 'Start learning today by enrolling in a course.'}
          </p>
        </div>
        <Link href="/courses" className="flex items-center gap-2 px-4 py-2.5 bg-primary hover:opacity-90 hover:scale-[1.02] active:scale-[0.98] text-primary-foreground text-sm font-medium rounded-button transition-all duration-200">
          <BookOpen className="w-4 h-4" />Browse courses
        </Link>
      </div>

      {/* Stats row - bento grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          {
            label: 'Day streak', value: streakDays,
            suffix: streakDays === 1 ? 'day' : 'days',
            icon: Flame,
            color: streakDays > 0 ? 'text-warning' : 'text-muted-foreground',
          },
          {
            label: 'Learning time', value: totalMins < 60 ? totalMins : Math.round(totalMins / 60),
            suffix: totalMins < 60 ? 'mins' : 'hrs',
            icon: Clock, color: 'text-primary',
          },
          {
            label: 'Courses done', value: completed.length, suffix: '',
            icon: CheckCircle2, color: 'text-success',
          },
          {
            label: 'Monthly activity', value: engagementPct, suffix: '%',
            icon: TrendingUp, color: 'text-accent',
          },
        ].map(({ label, value, suffix, icon: Icon, color }) => (
          <BentoCard key={label} padding="sm" className="space-y-2 transition-all duration-200 hover:shadow-md hover:border-primary/20">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground text-xs font-medium">{label}</span>
              <Icon className={cn('w-4 h-4', color)} />
            </div>
            <p className="text-2xl font-bold text-card-foreground">
              {value}<span className="text-sm font-normal text-muted-foreground ml-1">{suffix}</span>
            </p>
          </BentoCard>
        ))}
      </div>

      {/* Streak motivation */}
      {streakDays >= 1 && (
        <BentoCard padding="md" className="bg-warning/10 border-warning/30 flex items-center gap-3 transition-all duration-200 hover:shadow-md hover:border-warning/50">
          <Flame className="w-5 h-5 text-warning shrink-0" />
          <p className="text-sm text-card-foreground">
            {streakDays >= 7 ? `${streakDays}-day streak — you're on fire! 🔥 Keep it going.`
              : streakDays >= 3 ? `${streakDays}-day streak! Great consistency — you're building a habit.`
              : "You're on a streak! Come back tomorrow to keep it going."}
          </p>
        </BentoCard>
      )}

      {/* Required by your organisation */}
      {requiredItems.length > 0 && (
        <BentoCard padding="md" className="border-warning/50 space-y-3">
          <h2 className="text-sm font-semibold text-card-foreground flex items-center gap-2">
            <Lock className="w-4 h-4 text-warning" />
            Required by your organisation
          </h2>
          <ul className="space-y-2">
            {requiredItems.map((r) => (
              <li key={r.id}>
                <Link href={`/paths/${r.path_id}`} className="flex items-center justify-between gap-3 py-2 px-3 rounded-button hover:bg-warning/10 transition-colors group">
                  <div className="flex items-center gap-2 min-w-0">
                    <Route className="w-4 h-4 text-warning shrink-0" />
                    <span className="text-sm font-medium text-card-foreground truncate group-hover:text-warning-foreground">{r.title}</span>
                  </div>
                  <span className="text-xs text-muted-foreground shrink-0">{Math.round(r.progress_pct)}%</span>
                  <ArrowRight className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
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
            <Calendar className="w-4 h-4 text-warning" />
            Upcoming deadlines
          </h2>
          <ul className="space-y-2">
            {upcomingDeadlines.map((d) => (
              <li key={d.id}>
                <Link href={d.href} className="flex items-center justify-between gap-3 py-2 px-3 rounded-button hover:bg-muted transition-colors group">
                  <div className="flex items-center gap-2 min-w-0">
                    {d.isPath ? <Route className="w-4 h-4 text-primary shrink-0" /> : <BookOpen className="w-4 h-4 text-primary shrink-0" />}
                    <span className="text-sm font-medium text-card-foreground truncate group-hover:text-primary">{d.title}</span>
                  </div>
                  <span className="text-xs text-muted-foreground shrink-0">{new Date(d.due_date).toLocaleDateString()}</span>
                  <ArrowRight className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                </Link>
              </li>
            ))}
          </ul>
        </BentoCard>
      )}

      {/* Sudar memory card */}
      {interactionCount > 0 && (
        <BentoCard padding="md" className="bg-primary/5 border-primary/20 flex items-start gap-4 transition-all duration-200 hover:shadow-md hover:border-primary/30">
          <div className="w-10 h-10 rounded-card bg-card border border-border shadow-sm flex items-center justify-center shrink-0">
            <Bot className="w-5 h-5 text-primary" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-card-foreground">
              Sudar has learned from {interactionCount} interaction{interactionCount !== 1 ? 's' : ''} with you
            </p>
            <p className="text-muted-foreground text-xs mt-0.5">
              {(memory.known_concepts as string[] | undefined)?.length
                ? `Concepts covered: ${(memory.known_concepts as string[]).slice(0, 3).join(', ')}${(memory.known_concepts as string[]).length > 3 ? ' and more' : ''}`
                : "Sudar is learning your style. Keep asking questions!"}
            </p>
          </div>
          <Link href="/memory" className="text-xs font-medium text-primary hover:opacity-90 px-3 py-1.5 rounded-button hover:bg-primary/10 transition-all shrink-0">
            View memory →
          </Link>
        </BentoCard>
      )}

      {/* Next best action — Sudar recommends */}
      {(() => {
        const nba = learnerProfile?.next_best_action as Record<string, unknown> | null
        if (!nba?.course_id) return null
        return (
          <BentoCard padding="md" variant="elevated" className="rounded-card-xl border-primary/20 transition-all duration-200 hover:shadow-lg hover:border-primary/30">
            <div className="flex items-start gap-4">
              <div className="w-11 h-11 rounded-card bg-primary flex items-center justify-center shadow-md shrink-0">
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
              className="mt-4 flex items-center justify-center gap-2 w-full py-2.5 bg-primary hover:opacity-90 hover:scale-[1.01] active:scale-[0.99] text-primary-foreground text-sm font-semibold rounded-button transition-all duration-200"
            >
              <BookOpen className="w-4 h-4" />Start this course<ArrowRight className="w-4 h-4" />
            </Link>
          </BentoCard>
        )
      })()}

      {/* In-progress courses */}
      {inProgress.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-base font-semibold text-card-foreground">Continue learning</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {inProgress.map((course) => (
              <Link key={course.id} href={`/courses/${course.id}`}>
                <BentoCard padding="md" className="hover:border-primary/40 hover:shadow-lg hover:scale-[1.01] active:scale-[0.99] transition-all duration-200 group">
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

      {/* Empty state */}
      {enrolledCourses.length === 0 && (
        <BentoCard padding="lg" variant="elevated" className="rounded-card-xl text-center space-y-4 border-primary/10">
          <div className="w-14 h-14 rounded-card-xl bg-card border border-border shadow-sm flex items-center justify-center mx-auto">
            <GraduationCap className="w-7 h-7 text-primary" />
          </div>
          <div className="space-y-1.5">
            <h2 className="text-base font-semibold text-card-foreground">No courses yet</h2>
            <p className="text-muted-foreground text-sm">Browse the catalog and enroll in your first course.</p>
          </div>
          <Link href="/courses" className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary hover:opacity-90 hover:scale-[1.02] active:scale-[0.98] text-primary-foreground text-sm font-medium rounded-button transition-all duration-200 shadow-lg">
            <BookOpen className="w-4 h-4" />Browse courses<ArrowRight className="w-4 h-4" />
          </Link>
        </BentoCard>
      )}

      {/* Completed */}
      {completed.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-base font-semibold text-card-foreground flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-success" />Completed courses
          </h2>
          <BentoCard padding="none" className="overflow-hidden divide-y divide-border">
            {completed.map((course) => (
              <Link key={course.id} href={`/courses/${course.id}`}
                className="flex items-center gap-3 px-5 py-4 hover:bg-muted transition-colors duration-200 group"
              >
                <CheckCircle2 className="w-5 h-5 text-success shrink-0" />
                <span className="flex-1 text-sm font-medium text-muted-foreground group-hover:text-card-foreground">{course.title}</span>
                <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-card-foreground" />
              </Link>
            ))}
          </BentoCard>
        </div>
      )}
    </div>
  )
}

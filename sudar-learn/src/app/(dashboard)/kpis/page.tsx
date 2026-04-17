import { createClient, createAdminClient } from '@/lib/supabase/server'
import type { Metadata } from 'next'
import Link from 'next/link'
import { Flame, Clock, CheckCircle2, Target, TrendingUp, Medal, Award, BarChart3, ChevronRight, Crown, PauseCircle, ShieldCheck } from 'lucide-react'
import { cn } from '@/lib/utils'
import { BentoCard } from '@/components/ui/BentoCard'

export const metadata: Metadata = { title: 'My KPIs — Sudar' }

function ProgressRing({ value, max = 100, size = 64, strokeWidth = 6 }: {
  value: number; max?: number; size?: number; strokeWidth?: number
}) {
  const radius = (size - strokeWidth) / 2
  const circumference = radius * Math.PI * 2
  const progress = Math.min(value / max, 1)
  const dash = circumference * progress

  return (
    <svg width={size} height={size} className="-rotate-90">
      <circle cx={size / 2} cy={size / 2} r={radius} stroke="currentColor" strokeWidth={strokeWidth} fill="none" className="text-muted" />
      <circle
        cx={size / 2} cy={size / 2} r={radius}
        stroke="currentColor" strokeWidth={strokeWidth} fill="none"
        strokeDasharray={`${dash} ${circumference}`}
        className="text-primary transition-all duration-700"
        strokeLinecap="round"
      />
    </svg>
  )
}

export default async function KPIDashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const admin = createAdminClient()

  const [profileRes, learnerProfileRes] = await Promise.all([
    admin.from('profiles').select('full_name, org_id').eq('id', user!.id).single(),
    admin.from('learner_profiles').select(
      'streak_days, avg_completion_rate, total_learning_minutes, overall_engagement_score, xp_total, scholar_level, scholar_title, coin_balance'
    ).eq('user_id', user!.id).single(),
  ])

  const profile = profileRes.data
  const lp = learnerProfileRes.data

  // Compute weekly learning time
  const weekStart = new Date()
  weekStart.setHours(0, 0, 0, 0)
  weekStart.setDate(weekStart.getDate() - weekStart.getDay())

  const { data: weeklyEvents } = await admin
    .from('learning_events')
    .select('event_type, duration_secs, payload')
    .eq('user_id', user!.id)
    .gte('created_at', weekStart.toISOString())

  const weeklyMins = Math.round(
    (weeklyEvents ?? []).reduce((s, e) => s + Math.min(e.duration_secs ?? 0, 3600), 0) / 60
  )
  const trackedSeconds = (weeklyEvents ?? []).reduce((sum, evt) => {
    const payload = (evt.payload as Record<string, unknown> | null) ?? null
    if (!payload) return sum
    const active = payload.active_secs
    if (typeof active !== 'number' || !Number.isFinite(active)) return sum
    return sum + Math.max(0, active)
  }, 0)
  const trackedTotalSeconds = (weeklyEvents ?? []).reduce((sum, evt) => {
    const payload = (evt.payload as Record<string, unknown> | null) ?? null
    if (!payload) return sum
    const total = payload.total_secs
    if (typeof total !== 'number' || !Number.isFinite(total)) return sum
    return sum + Math.max(0, total)
  }, 0)
  const activeIntegrityPct = trackedTotalSeconds > 0
    ? Math.round((trackedSeconds / trackedTotalSeconds) * 100)
    : 100
  const warningCount = (weeklyEvents ?? []).filter((e) => e.event_type === 'inactivity_warning_started').length
  const hibernationCount = (weeklyEvents ?? []).filter((e) => e.event_type === 'inactivity_hibernated').length

  // Quiz mastery average
  const { data: quizEvents } = await admin
    .from('learning_events')
    .select('payload')
    .eq('user_id', user!.id)
    .eq('event_type', 'quiz_attempt')
    .limit(50)

  const quizScores = (quizEvents ?? [])
    .map((e) => (e.payload as Record<string, unknown>)?.score as number)
    .filter((s) => typeof s === 'number' && s >= 0)
  const avgQuizScore = quizScores.length > 0
    ? Math.round(quizScores.reduce((a, b) => a + b, 0) / quizScores.length)
    : 0

  // Completion count
  const { count: completedCourses } = await admin
    .from('enrollments')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', user!.id)
    .eq('status', 'completed')

  // Skill gaps closed
  const { count: gapsClosed } = await admin
    .from('skill_gaps')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', user!.id)
    .not('resolved_at', 'is', null)

  // Org leaderboard rank
  let orgRank: number | null = null
  let orgSize: number | null = null
  if (profile?.org_id) {
    const { data: orgMembers } = await admin
      .from('profiles')
      .select('id')
      .eq('org_id', profile.org_id)
    const orgIds = (orgMembers ?? []).map((m) => m.id)
    if (orgIds.length > 0) {
      const { data: orgXp } = await admin
        .from('learner_profiles')
        .select('user_id, xp_total')
        .in('user_id', orgIds)
        .order('xp_total', { ascending: false })
      orgSize = orgXp?.length ?? null
      const rankIdx = orgXp?.findIndex((x) => x.user_id === user!.id) ?? -1
      if (rankIdx >= 0) orgRank = rankIdx + 1
    }
  }

  const engagementPct = Math.round((lp?.overall_engagement_score ?? 0) * 100)
  const streakDays = lp?.streak_days ?? 0
  const scholarLevel = lp?.scholar_level ?? 1
  const scholarTitle = lp?.scholar_title ?? 'Seeker'
  const xpTotal = lp?.xp_total ?? 0
  const coinBalance = lp?.coin_balance ?? 0

  const kpis = [
    {
      label: 'Learning Streak',
      value: streakDays,
      suffix: streakDays === 1 ? 'day' : 'days',
      icon: Flame,
      color: streakDays > 0 ? 'text-warning' : 'text-muted-foreground',
      ring: streakDays > 0 ? (streakDays / 90) * 100 : 0,
      note: streakDays >= 7 ? 'On fire!' : streakDays > 0 ? 'Keep it going' : 'Start today',
    },
    {
      label: 'Learning Time',
      value: weeklyMins < 60 ? weeklyMins : Math.round(weeklyMins / 60 * 10) / 10,
      suffix: weeklyMins < 60 ? 'min this week' : 'hrs this week',
      icon: Clock,
      color: 'text-primary',
      ring: Math.min((weeklyMins / 120) * 100, 100),
      note: weeklyMins >= 60 ? 'Great pace' : 'Aim for 1hr+',
    },
    {
      label: 'Courses Done',
      value: completedCourses ?? 0,
      suffix: 'completed',
      icon: CheckCircle2,
      color: 'text-success',
      ring: Math.min(((completedCourses ?? 0) / 10) * 100, 100),
      note: (completedCourses ?? 0) > 0 ? `${completedCourses} courses` : 'Enroll now',
    },
    {
      label: 'Quiz Mastery',
      value: avgQuizScore,
      suffix: '%',
      icon: Target,
      color: avgQuizScore >= 80 ? 'text-success' : avgQuizScore >= 60 ? 'text-warning' : 'text-destructive',
      ring: avgQuizScore,
      note: avgQuizScore >= 90 ? 'Excellent' : avgQuizScore >= 70 ? 'Good' : 'Keep practicing',
    },
    {
      label: 'Skill Gaps Closed',
      value: gapsClosed ?? 0,
      suffix: 'gaps',
      icon: TrendingUp,
      color: 'text-accent',
      ring: Math.min(((gapsClosed ?? 0) / 10) * 100, 100),
      note: 'Resolved topics',
    },
    {
      label: 'Engagement',
      value: engagementPct,
      suffix: '%',
      icon: BarChart3,
      color: 'text-primary',
      ring: engagementPct,
      note: engagementPct >= 70 ? 'Highly engaged' : engagementPct >= 40 ? 'Active' : 'Getting started',
    },
    {
      label: 'Time Integrity',
      value: activeIntegrityPct,
      suffix: '% active',
      icon: ShieldCheck,
      color: activeIntegrityPct >= 80 ? 'text-success' : activeIntegrityPct >= 60 ? 'text-warning' : 'text-destructive',
      ring: activeIntegrityPct,
      note: activeIntegrityPct >= 80 ? 'Reliable focus time' : 'More idle periods detected',
    },
    {
      label: 'Inactivity Alerts',
      value: warningCount,
      suffix: 'warnings',
      icon: PauseCircle,
      color: warningCount <= 2 ? 'text-success' : warningCount <= 5 ? 'text-warning' : 'text-destructive',
      ring: Math.min((warningCount / 8) * 100, 100),
      note: `${hibernationCount} hibernation${hibernationCount === 1 ? '' : 's'} this week`,
    },
  ]

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-card-foreground">My KPI Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Your learning performance at a glance
          </p>
        </div>
        {orgRank && orgSize && (
          <div className="flex items-center gap-2 px-4 py-2 rounded-full border border-border bg-card">
            <Medal className="w-4 h-4 text-primary" />
            <span className="text-sm font-semibold text-card-foreground">
              Rank #{orgRank}
            </span>
            <span className="text-xs text-muted-foreground">of {orgSize}</span>
          </div>
        )}
      </div>

      {/* Scholar rank hero */}
      <BentoCard padding="lg" variant="elevated" className="bg-primary/5 border-primary/20">
        <div className="flex items-center gap-6">
          <div className="relative shrink-0">
            <ProgressRing value={xpTotal % 1000} max={1000} size={80} strokeWidth={7} />
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-xl font-bold text-card-foreground">{scholarLevel}</span>
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-baseline gap-2">
              <h2 className="font-display text-2xl font-bold text-card-foreground">{scholarTitle}</h2>
              <span className="text-sm text-muted-foreground">Level {scholarLevel}</span>
            </div>
            <p className="text-sm text-muted-foreground mt-0.5">{xpTotal.toLocaleString()} XP total</p>
          </div>
          <div className="text-right shrink-0">
            <p className="text-xs text-muted-foreground">Sudar Coins</p>
            <p className="text-xl font-bold text-card-foreground flex items-center gap-1 justify-end">
              <span className="text-xl">⬡</span>{coinBalance.toLocaleString()}
            </p>
            <Link href="/coins" className="text-xs text-primary hover:opacity-80">View wallet →</Link>
          </div>
        </div>
      </BentoCard>

      {/* KPI grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {kpis.map(({ label, value, suffix, icon: Icon, color, ring, note }) => (
          <BentoCard key={label} padding="md" className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{label}</span>
              <Icon className={cn('w-4 h-4', color)} />
            </div>
            <div className="flex items-end gap-2">
              <span className="text-3xl font-bold text-card-foreground tabular-nums leading-none">{value}</span>
              <span className="text-sm text-muted-foreground mb-0.5">{suffix}</span>
            </div>
            <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-primary rounded-full transition-[width] duration-700"
                style={{ width: `${ring}%` }}
              />
            </div>
            <p className="text-xs text-muted-foreground">{note}</p>
          </BentoCard>
        ))}
      </div>

      {/* Org leaderboard preview */}
      {profile?.org_id && (
        <BentoCard padding="md">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Crown className="w-4 h-4 text-primary" />
              <h2 className="text-sm font-semibold text-card-foreground">Org Leaderboard</h2>
            </div>
            <Link
              href={`/leaderboard`}
              className="text-xs text-primary flex items-center gap-0.5 hover:opacity-80"
            >
              Full leaderboard <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          {orgRank ? (
            <div className="flex items-center justify-between py-3 px-4 rounded-button bg-primary/5 border border-primary/20">
              <div className="flex items-center gap-3">
                <span className="text-xl font-bold text-primary">#{orgRank}</span>
                <div>
                  <p className="text-sm font-semibold text-card-foreground">{profile.full_name ?? 'You'}</p>
                  <p className="text-xs text-muted-foreground">{xpTotal.toLocaleString()} XP</p>
                </div>
              </div>
              <span className="text-xs text-muted-foreground">of {orgSize}</span>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Start learning to appear on the leaderboard.</p>
          )}
        </BentoCard>
      )}

      {/* Achievements quick link */}
      <BentoCard padding="md" className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Award className="w-5 h-5 text-primary" />
          <div>
            <p className="text-sm font-semibold text-card-foreground">View Achievements</p>
            <p className="text-xs text-muted-foreground">Unlock badges by learning</p>
          </div>
        </div>
        <Link
          href="/achievements"
          className="flex items-center gap-1 px-3 py-1.5 bg-primary text-primary-foreground rounded-button text-xs font-semibold hover:opacity-90 transition-all"
        >
          See all <ChevronRight className="w-3.5 h-3.5" />
        </Link>
      </BentoCard>
    </div>
  )
}

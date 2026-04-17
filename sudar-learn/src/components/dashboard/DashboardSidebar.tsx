'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  BookOpen,
  ChevronRight,
  BarChart2,
  Brain,
  Route,
  Award,
  CheckCircle2,
  ArrowUpRight,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { UserAvatar } from '@/components/ui/UserAvatar'

export type PeriodKey = 'thisWeek' | 'thisMonth' | 'last30'

export interface PeriodStat {
  totalMins: number
  sessions: number
  modulesCompleted: number
}

export interface PeriodStats {
  thisWeek: PeriodStat
  thisMonth: PeriodStat
  last30: PeriodStat
}

export interface CourseItem {
  id: string
  title: string
  progress_pct: number
  enrollStatus: string
}

export interface LeaderboardEntry {
  rank: number
  userId: string
  fullName: string | null
  avatarUrl: string | null
  totalMins: number
  isCurrentUser: boolean
}

interface DashboardSidebarProps {
  periodStats: PeriodStats
  streakDays: number
  completedCount: number
  inProgress: CourseItem[]
  completed: CourseItem[]
  leaderboard?: LeaderboardEntry[] | null
  currentUserId?: string
}

const PERIOD_LABELS: Record<PeriodKey, string> = {
  thisWeek: 'This week',
  thisMonth: 'This month',
  last30: 'Last 30 days',
}

export function DashboardSidebar({
  periodStats,
  streakDays,
  completedCount,
  inProgress,
  completed,
  leaderboard,
}: DashboardSidebarProps) {
  const [period, setPeriod] = useState<PeriodKey>('thisWeek')
  const stat = periodStats[period]
  const totalMins = Number(stat?.totalMins) || 0
  const sessions = Number(stat?.sessions) || 0
  const modulesCompleted = Number(stat?.modulesCompleted) || 0
  const streak = Number(streakDays) || 0

  const compactCourses = [...inProgress, ...completed].slice(0, 5)

  return (
    <div className="flex flex-col gap-6">
      {/* Period filter */}
      <div className="flex flex-col gap-2">
        <h3 className="font-display text-lg font-bold text-card-foreground">Your activity</h3>
        <div className="flex rounded-button bg-muted p-0.5">
          {(Object.keys(PERIOD_LABELS) as PeriodKey[]).map((key) => (
            <button
              key={key}
              type="button"
              onClick={() => setPeriod(key)}
              className={cn(
                'flex-1 py-2 px-3 text-xs font-semibold rounded-lg transition-colors',
                period === key
                  ? 'bg-card text-card-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-card-foreground'
              )}
            >
              {PERIOD_LABELS[key]}
            </button>
          ))}
        </div>
      </div>

      {/* KPIs summary — values from server (period-scoped), always numeric */}
      <div className="grid grid-cols-2 gap-2">
        <div className="kpi-card !p-3">
          <span className="text-muted-foreground text-[10px] font-medium uppercase tracking-wider">Learning time</span>
          <p className="text-lg font-bold text-card-foreground mt-0.5">
            {totalMins < 60 ? `${totalMins}m` : `${Math.round(totalMins / 60)}h`}
          </p>
        </div>
        <div className="kpi-card !p-3">
          <span className="text-muted-foreground text-[10px] font-medium uppercase tracking-wider">Sessions</span>
          <p className="text-lg font-bold text-card-foreground mt-0.5">{sessions}</p>
        </div>
        <div className="kpi-card !p-3">
          <span className="text-muted-foreground text-[10px] font-medium uppercase tracking-wider">Modules done</span>
          <p className="text-lg font-bold text-primary mt-0.5">{modulesCompleted}</p>
        </div>
        <div className="kpi-card !p-3">
          <span className="text-muted-foreground text-[10px] font-medium uppercase tracking-wider">Streak</span>
          <p className="text-lg font-bold text-warning mt-0.5">{streak} day{streak !== 1 ? 's' : ''}</p>
        </div>
      </div>

      {/* Insights */}
      <div className="space-y-1.5">
        <p className="text-sm text-card-foreground">
          You learned <span className="font-semibold text-primary">{totalMins} minutes</span> in this period.
        </p>
        {modulesCompleted > 0 && (
          <p className="text-sm text-muted-foreground">
            <span className="font-medium text-card-foreground">{modulesCompleted}</span> module{modulesCompleted !== 1 ? 's' : ''} completed.
          </p>
        )}
        {streak > 0 && (
          <p className="text-sm text-muted-foreground">
            <span className="font-medium text-warning">{streak}-day</span> streak — keep it up!
          </p>
        )}
      </div>

      {/* Leaderboard (optional) */}
      {leaderboard && leaderboard.length > 0 && (
        <div className="space-y-2">
          <h3 className="font-display text-sm font-bold text-card-foreground">Leaderboard</h3>
          <ul className="space-y-1">
            {leaderboard.slice(0, 10).map((entry) => (
              <li
                key={entry.userId}
                className={cn(
                  'flex items-center justify-between gap-2 py-1.5 px-2 rounded-button text-xs',
                  entry.isCurrentUser ? 'bg-primary/10 text-primary font-medium' : 'text-muted-foreground'
                )}
              >
                <span className="flex items-center gap-2 min-w-0">
                  <span className="font-bold text-muted-foreground w-5 shrink-0">#{entry.rank}</span>
                  <UserAvatar
                    email=""
                    fullName={entry.fullName}
                    avatarUrl={entry.avatarUrl}
                    size="xs"
                    className="shrink-0"
                  />
                  <span className="truncate">{entry.fullName || 'Anonymous'}{entry.isCurrentUser ? ' (you)' : ''}</span>
                </span>
                <span className="shrink-0 font-semibold">{entry.totalMins}m</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Quick links */}
      <div className="space-y-1">
        <h3 className="font-display text-sm font-bold text-card-foreground">Quick links</h3>
        <div className="flex flex-col gap-0.5">
          <Link href="/progress" className="flex items-center gap-2 py-2 px-2 rounded-button hover:bg-muted text-sm text-muted-foreground hover:text-card-foreground transition-colors">
            <BarChart2 className="w-4 h-4 shrink-0" /> Progress <ChevronRight className="w-3.5 h-3.5 ml-auto" />
          </Link>
          <Link href="/memory" className="flex items-center gap-2 py-2 px-2 rounded-button hover:bg-muted text-sm text-muted-foreground hover:text-card-foreground transition-colors">
            <Brain className="w-4 h-4 shrink-0" /> Memory <ChevronRight className="w-3.5 h-3.5 ml-auto" />
          </Link>
          <Link href="/paths" className="flex items-center gap-2 py-2 px-2 rounded-button hover:bg-muted text-sm text-muted-foreground hover:text-card-foreground transition-colors">
            <Route className="w-4 h-4 shrink-0" /> Paths <ChevronRight className="w-3.5 h-3.5 ml-auto" />
          </Link>
          <Link href="/progress#certifications" className="flex items-center gap-2 py-2 px-2 rounded-button hover:bg-muted text-sm text-muted-foreground hover:text-card-foreground transition-colors">
            <Award className="w-4 h-4 shrink-0" /> Certificates <ChevronRight className="w-3.5 h-3.5 ml-auto" />
          </Link>
        </div>
      </div>

      {/* Compact course list */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="font-display text-sm font-bold text-card-foreground">Your courses</h3>
          <Link href="/progress" className="text-xs text-primary hover:opacity-90 font-medium flex items-center gap-0.5">
            View all <ArrowUpRight className="w-3 h-3" />
          </Link>
        </div>
        {compactCourses.length === 0 ? (
          <p className="text-muted-foreground text-xs py-3">No courses yet. Browse the catalog to get started.</p>
        ) : (
          <ul className="space-y-1">
            {compactCourses.map((course) => (
              <li key={course.id}>
                <Link
                  href={`/courses/${course.id}`}
                  className="flex items-center justify-between gap-2 py-2 px-2 rounded-button hover:bg-muted transition-colors group"
                >
                  <span className="text-sm font-medium text-card-foreground truncate group-hover:text-primary">
                    {course.title}
                  </span>
                  <span className="text-xs text-muted-foreground shrink-0 flex items-center gap-1">
                    {course.enrollStatus === 'completed' ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-success" />
                    ) : (
                      `${Math.round(course.progress_pct)}%`
                    )}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}

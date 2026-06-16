'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Trophy } from 'lucide-react'
import { BentoCard } from '@/components/ui/BentoCard'
import { UserAvatar } from '@/components/ui/UserAvatar'

type LeaderboardEntry = {
  rank: number
  userId: string
  xp: number
  name?: string | null
  avatar?: string | null
  isCurrentUser?: boolean
  level?: number
  title?: string
}

type Tab = 'weekly' | 'allTime'

export default function LeaderboardPage() {
  const [tab, setTab] = useState<Tab>('weekly')
  const [weekly, setWeekly] = useState<LeaderboardEntry[]>([])
  const [allTime, setAllTime] = useState<LeaderboardEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      try {
        const profileRes = await fetch('/api/learner/profile-summary')
        if (!profileRes.ok) {
          setError('Could not load your profile.')
          return
        }
        const profile = (await profileRes.json()) as { orgId?: string | null }
        if (!profile.orgId) {
          setError('Join an organisation to see the leaderboard.')
          return
        }
        const lbRes = await fetch(`/api/leaderboard/${profile.orgId}`)
        if (!lbRes.ok) {
          setError('Leaderboard unavailable.')
          return
        }
        const json = (await lbRes.json()) as {
          data?: { weekly?: LeaderboardEntry[]; allTime?: LeaderboardEntry[] }
        }
        setWeekly(json.data?.weekly ?? [])
        setAllTime(json.data?.allTime ?? [])
      } finally {
        setLoading(false)
      }
    }
    void load()
  }, [])

  const rows = tab === 'weekly' ? weekly : allTime
  const yourRow = rows.find((r) => r.isCurrentUser)

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-card-foreground flex items-center gap-2">
          <Trophy className="w-6 h-6 text-warning" /> Org leaderboard
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Rankings from real learning XP—weekly resets Sunday; all-time includes scholar level.
        </p>
      </div>

      <div className="flex gap-2">
        {(['weekly', 'allTime'] as const).map((key) => (
          <button
            key={key}
            type="button"
            onClick={() => setTab(key)}
            className={`rounded-full px-4 py-1.5 text-sm font-medium border transition-colors ${
              tab === key
                ? 'border-primary bg-primary/10 text-primary'
                : 'border-border text-muted-foreground hover:text-card-foreground'
            }`}
          >
            {key === 'weekly' ? 'This week' : 'All time'}
          </button>
        ))}
      </div>

      {yourRow && (
        <BentoCard padding="md" className="border-primary/30 bg-primary/5">
          <p className="text-xs font-semibold uppercase tracking-wider text-primary mb-2">Your rank</p>
          <p className="text-lg font-bold text-card-foreground">
            #{yourRow.rank} · {yourRow.xp.toLocaleString()} XP
            {yourRow.title ? ` · ${yourRow.title}` : ''}
          </p>
        </BentoCard>
      )}

      <BentoCard padding="none" className="overflow-hidden">
        {loading ? (
          <p className="p-6 text-sm text-muted-foreground">Loading…</p>
        ) : error ? (
          <p className="p-6 text-sm text-muted-foreground">{error}</p>
        ) : rows.length === 0 ? (
          <p className="p-6 text-sm text-muted-foreground">No rankings yet. Complete a module to earn XP.</p>
        ) : (
          <ul className="divide-y divide-border">
            {rows.map((entry) => (
              <li
                key={`${entry.userId}-${entry.rank}`}
                className={`flex items-center gap-3 px-4 py-3 ${
                  entry.isCurrentUser ? 'bg-primary/5' : ''
                }`}
              >
                <span className="w-8 text-sm font-bold text-muted-foreground tabular-nums">#{entry.rank}</span>
                <UserAvatar
                  name={entry.name ?? 'Learner'}
                  avatarUrl={entry.avatar ?? undefined}
                  className="w-8 h-8"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-card-foreground truncate">
                    {entry.name ?? 'Learner'}
                    {entry.isCurrentUser ? ' (you)' : ''}
                  </p>
                  {entry.title && (
                    <p className="text-xs text-muted-foreground">{entry.title}</p>
                  )}
                </div>
                <span className="text-sm font-semibold text-card-foreground tabular-nums">
                  {entry.xp.toLocaleString()} XP
                </span>
              </li>
            ))}
          </ul>
        )}
      </BentoCard>

      <p className="text-xs text-muted-foreground">
        <Link href="/gamification" className="text-primary hover:underline">
          How gamification works
        </Link>
        {' · '}
        <Link href="/help/article/learners/leaderboard" className="text-primary hover:underline">
          Help article
        </Link>
      </p>
    </div>
  )
}

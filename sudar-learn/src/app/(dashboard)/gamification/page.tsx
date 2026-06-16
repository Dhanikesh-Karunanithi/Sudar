'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Trophy, Flame, Target, Coins, Award, ChevronRight } from 'lucide-react'
import { BentoCard } from '@/components/ui/BentoCard'
import { QuestCard } from '@/components/features/gamification/QuestCard'

type LeaderboardEntry = {
  rank: number
  userId: string
  xp: number
  name?: string | null
  isCurrentUser?: boolean
  level?: number
  title?: string
}

export default function GamificationHubPage() {
  const [weekly, setWeekly] = useState<LeaderboardEntry[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      try {
        const profileRes = await fetch('/api/learner/profile-summary')
        if (!profileRes.ok) return
        const profile = (await profileRes.json()) as { orgId?: string | null }
        if (!profile.orgId) return
        const lbRes = await fetch(`/api/leaderboard/${profile.orgId}`)
        if (!lbRes.ok) return
        const json = (await lbRes.json()) as { data?: { weekly?: LeaderboardEntry[] } }
        setWeekly(json.data?.weekly ?? [])
      } finally {
        setLoading(false)
      }
    }
    void load()
  }, [])

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="font-display text-2xl font-bold text-card-foreground">Gamification</h1>
        <p className="text-muted-foreground text-sm mt-1">
          How quests, coins, achievements, and leaderboard work together in Sudar Learn.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {[
          {
            icon: Target,
            title: 'Daily quests',
            body: 'Complete specific actions—finish a module, maintain your streak, or log focused time—to earn XP and coins.',
            href: '/',
          },
          {
            icon: Coins,
            title: 'Coins',
            body: 'Spend coins on profile flair and optional rewards. Earn them from quests and module milestones—not generic “Get XP!” tasks.',
            href: '/coins',
          },
          {
            icon: Award,
            title: 'Achievements',
            body: 'Badges unlock when you hit concrete milestones: first course complete, 7-day streak, modality explorer, and more.',
            href: '/achievements',
          },
          {
            icon: Trophy,
            title: 'Leaderboard',
            body: 'Org-scoped weekly and all-time rankings based on XP from real learning events.',
            href: '/leaderboard',
          },
        ].map(({ icon: Icon, title, body, href }) => (
          <BentoCard key={title} padding="md" className="space-y-3">
            <div className="flex items-center gap-2">
              <Icon className="w-5 h-5 text-primary" />
              <h2 className="font-semibold text-card-foreground">{title}</h2>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">{body}</p>
            <Link href={href} className="text-sm font-medium text-primary hover:opacity-90 inline-flex items-center gap-1">
              Open <ChevronRight className="w-4 h-4" />
            </Link>
          </BentoCard>
        ))}
      </div>

      <QuestCard />

      <BentoCard padding="md" className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-card-foreground flex items-center gap-2">
            <Flame className="w-4 h-4 text-warning" /> Weekly leaderboard preview
          </h2>
          <Link href="/leaderboard" className="text-sm text-primary hover:opacity-90">
            Full leaderboard →
          </Link>
        </div>
        {loading ? (
          <p className="text-sm text-muted-foreground">Loading rankings…</p>
        ) : weekly.length === 0 ? (
          <p className="text-sm text-muted-foreground">No XP logged this week yet. Complete a module to appear.</p>
        ) : (
          <ul className="space-y-2">
            {weekly.slice(0, 5).map((entry) => (
              <li
                key={entry.userId}
                className={`flex items-center justify-between rounded-lg px-3 py-2 text-sm ${
                  entry.isCurrentUser ? 'bg-primary/10 border border-primary/20' : 'bg-muted/50'
                }`}
              >
                <span className="font-medium text-card-foreground">
                  #{entry.rank} {entry.name ?? 'Learner'}
                  {entry.isCurrentUser ? ' (you)' : ''}
                </span>
                <span className="text-muted-foreground tabular-nums">{entry.xp} XP</span>
              </li>
            ))}
          </ul>
        )}
      </BentoCard>

      <p className="text-xs text-muted-foreground">
        Help:{' '}
        <Link href="/help/article/learners/gamification" className="text-primary hover:underline">
          Gamification in Learn
        </Link>
      </p>
    </div>
  )
}

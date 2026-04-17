'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { TrendingUp, TrendingDown, History } from 'lucide-react'
import { cn } from '@/lib/utils'
import { BentoCard } from '@/components/ui/BentoCard'
import { RewardCatalogModal } from '@/components/features/gamification/RewardCatalogModal'
import { getLevelForXp, SCHOLAR_RANKS } from '@/lib/gamification/types'

interface Transaction {
  amount: number
  event_type: string
  balance_after: number
  created_at: string
}

interface BalanceData {
  balance: number
  xp: number
  level: number
  title: string
  profileCompleteness: number
  recentTransactions: Transaction[]
}

const EVENT_LABELS: Record<string, string> = {
  module_complete:              'Module completed',
  course_complete:              'Course completed',
  quiz_attempt:                 'Quiz mastery',
  ai_tutor_session:             'AI tutor session',
  checkin_answered:             'Check-in answered',
  profile_question_answered:    'Profile question',
  streak_milestone_hit:         'Streak milestone',
  achievement_unlocked:         'Achievement unlocked',
  quest_completed:              'Quest completed',
  level_up:                     'Level up!',
  reward_redeemed:              'Reward redeemed',
  modality_explorer_bonus:      'Modality explorer bonus',
  course_reflection_submitted:  'Course reflection',
  manager_gift:                 'Manager gift',
  onboarding_step_complete:     'Onboarding step',
  creator_course_published:     'Course published',
}

export default function CoinsPage() {
  const [data, setData] = useState<BalanceData | null>(null)
  const [loading, setLoading] = useState(true)
  const [shopOpen, setShopOpen] = useState(false)

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/coins/balance')
        if (!res.ok) return
        const json = await res.json() as { data?: BalanceData }
        setData(json.data ?? null)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  if (loading || !data) {
    return (
      <div className="max-w-2xl mx-auto space-y-4 animate-pulse">
        <div className="h-36 bg-muted rounded-card-lg" />
        <div className="h-64 bg-muted rounded-card-lg" />
      </div>
    )
  }

  const currentRank = SCHOLAR_RANKS.find((r) => r.level === data.level)
  const nextRank = SCHOLAR_RANKS.find((r) => r.level === data.level + 1)
  const xpInLevel = nextRank ? data.xp - (currentRank?.xpRequired ?? 0) : 0
  const xpToNext = nextRank ? nextRank.xpRequired - (currentRank?.xpRequired ?? 0) : 0
  const levelProgressPct = nextRank && xpToNext > 0 ? Math.round((xpInLevel / xpToNext) * 100) : 100

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="font-display text-2xl font-bold text-card-foreground">Sudar Coins</h1>

      {/* Balance hero */}
      <BentoCard padding="lg" variant="elevated" className="bg-primary/5 border-primary/20">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-xs font-semibold text-primary uppercase tracking-wider mb-1">Your Balance</p>
            <div className="flex items-baseline gap-1.5">
              <span className="text-4xl font-bold text-card-foreground tabular-nums">{data.balance.toLocaleString()}</span>
              <span className="text-lg text-muted-foreground font-medium">SC</span>
            </div>
          </div>
          <button
            onClick={() => setShopOpen(true)}
            className="flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground text-sm font-semibold rounded-button hover:opacity-90 transition-all shadow-lg"
          >
            <span className="text-base">⬡</span> Spend Coins
          </button>
        </div>

        {/* Scholar rank */}
        <div className="mt-4 pt-4 border-t border-border/50">
          <div className="flex items-center justify-between mb-2">
            <div>
              <p className="text-sm font-bold text-card-foreground">{data.title}</p>
              <p className="text-xs text-muted-foreground">Level {data.level} · {data.xp.toLocaleString()} XP</p>
            </div>
            {nextRank && (
              <p className="text-xs text-muted-foreground">{nextRank.title} at {nextRank.xpRequired.toLocaleString()} XP</p>
            )}
          </div>
          <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-primary rounded-full transition-[width] duration-700"
              style={{ width: `${levelProgressPct}%` }}
            />
          </div>
        </div>
      </BentoCard>

      {/* Recent transactions */}
      <BentoCard padding="md">
        <div className="flex items-center gap-2 mb-4">
          <History className="w-4 h-4 text-muted-foreground" />
          <h2 className="text-sm font-semibold text-card-foreground">Recent Transactions</h2>
        </div>
        {data.recentTransactions.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-6">No transactions yet. Start learning to earn coins!</p>
        ) : (
          <div className="divide-y divide-border">
            {data.recentTransactions.map((tx, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.04 }}
                className="flex items-center justify-between py-3"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className={cn(
                    'w-8 h-8 rounded-lg flex items-center justify-center shrink-0',
                    tx.amount > 0 ? 'bg-success/10' : 'bg-destructive/10'
                  )}>
                    {tx.amount > 0
                      ? <TrendingUp className="w-4 h-4 text-success" />
                      : <TrendingDown className="w-4 h-4 text-destructive" />
                    }
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-card-foreground truncate">
                      {EVENT_LABELS[tx.event_type] ?? tx.event_type.replace(/_/g, ' ')}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(tx.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <p className={cn('text-sm font-bold tabular-nums', tx.amount > 0 ? 'text-success' : 'text-destructive')}>
                    {tx.amount > 0 ? '+' : ''}{tx.amount} SC
                  </p>
                  <p className="text-xs text-muted-foreground tabular-nums">{tx.balance_after.toLocaleString()} SC</p>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </BentoCard>

      <RewardCatalogModal
        open={shopOpen}
        onClose={() => setShopOpen(false)}
        currentBalance={data.balance}
        onPurchase={(nb) => setData((prev) => prev ? { ...prev, balance: nb } : prev)}
      />
    </div>
  )
}

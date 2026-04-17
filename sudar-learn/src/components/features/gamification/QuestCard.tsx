'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { CheckCircle2, ChevronRight, Coins, Star, Zap } from 'lucide-react'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { BentoCard } from '@/components/ui/BentoCard'

interface QuestStep {
  id: string
  title: string
  target: number
  coin_reward?: number
}

interface Quest {
  id: string
  quest_id: string
  status: 'active' | 'completed' | 'expired'
  progress: Record<string, number>
  quests: {
    slug: string
    title: string
    description: string
    quest_type: string
    steps: QuestStep[]
    coin_reward: number
    xp_reward: number
  } | null
}

interface QuestCardProps {
  className?: string
}

export function QuestCard({ className }: QuestCardProps) {
  const [quests, setQuests] = useState<{ daily: Quest[]; story: Quest[] } | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'daily' | 'story'>('daily')

  useEffect(() => {
    async function loadQuests() {
      try {
        const res = await fetch('/api/quests')
        if (!res.ok) return
        const json = await res.json() as { data?: { daily: Quest[]; story: Quest[] } }
        setQuests(json.data ?? null)
      } catch {
      } finally {
        setLoading(false)
      }
    }
    loadQuests()
  }, [])

  if (loading) {
    return (
      <BentoCard padding="md" className={cn('animate-pulse', className)}>
        <div className="h-4 w-24 bg-muted rounded mb-3" />
        <div className="space-y-2">
          {[1, 2, 3].map((i) => <div key={i} className="h-10 bg-muted rounded-button" />)}
        </div>
      </BentoCard>
    )
  }

  const displayQuests = activeTab === 'daily' ? (quests?.daily ?? []) : (quests?.story ?? [])

  function getStepProgress(quest: Quest, step: QuestStep): number {
    return Math.min(quest.progress[step.id] ?? 0, step.target)
  }

  function getQuestProgress(quest: Quest): number {
    const steps = quest.quests?.steps ?? []
    if (!steps.length) return 0
    const total = steps.reduce((acc, s) => acc + s.target, 0)
    const done = steps.reduce((acc, s) => acc + Math.min(quest.progress[s.id] ?? 0, s.target), 0)
    return total > 0 ? Math.round((done / total) * 100) : 0
  }

  return (
    <BentoCard padding="md" className={className}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center">
            <Zap className="w-4 h-4 text-primary" />
          </div>
          <h2 className="font-display text-base font-bold text-card-foreground">Quests</h2>
        </div>
        <div className="flex items-center gap-1 p-1 bg-muted rounded-full">
          {(['daily', 'story'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={cn(
                'px-3 py-1 rounded-full text-xs font-semibold transition-all',
                activeTab === tab
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:text-card-foreground'
              )}
            >
              {tab === 'daily' ? 'Daily' : 'Story'}
            </button>
          ))}
        </div>
      </div>

      {displayQuests.length === 0 && (
        <p className="text-sm text-muted-foreground text-center py-4">
          {activeTab === 'daily' ? 'All daily quests complete!' : 'No story quests yet.'}
        </p>
      )}

      <div className="space-y-2">
        {displayQuests.slice(0, 4).map((quest) => {
          const q = quest.quests
          if (!q) return null
          const progressPct = getQuestProgress(quest)
          const isDone = quest.status === 'completed'

          return (
            <motion.div
              key={quest.id}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              className={cn(
                'rounded-button border px-3 py-2.5 transition-colors',
                isDone
                  ? 'border-success/30 bg-success/5'
                  : 'border-border hover:border-primary/30 hover:bg-muted/50'
              )}
            >
              <div className="flex items-start justify-between gap-2 mb-1.5">
                <div className="flex items-center gap-2 min-w-0">
                  {isDone
                    ? <CheckCircle2 className="w-4 h-4 text-success shrink-0" />
                    : <div className="w-4 h-4 rounded-full border-2 border-primary/40 shrink-0" />
                  }
                  <span className={cn(
                    'text-sm font-medium truncate',
                    isDone ? 'text-muted-foreground line-through' : 'text-card-foreground'
                  )}>
                    {q.title}
                  </span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {q.coin_reward > 0 && (
                    <span className="inline-flex items-center gap-0.5 text-xs font-semibold text-yellow-600 dark:text-yellow-400">
                      <span className="text-sm">⬡</span>{q.coin_reward}
                    </span>
                  )}
                  {q.xp_reward > 0 && (
                    <span className="inline-flex items-center gap-0.5 text-xs font-semibold text-primary">
                      <Star className="w-3 h-3" />{q.xp_reward}
                    </span>
                  )}
                </div>
              </div>
              {!isDone && progressPct > 0 && (
                <div className="w-full h-1 bg-muted rounded-full overflow-hidden">
                  <div
                    className="bg-primary h-full rounded-full transition-[width] duration-500"
                    style={{ width: `${progressPct}%` }}
                  />
                </div>
              )}
            </motion.div>
          )
        })}
      </div>

      {activeTab === 'story' && (quests?.story?.length ?? 0) > 4 && (
        <Link
          href="/achievements"
          className="mt-2 flex items-center justify-center gap-1 text-xs text-primary hover:opacity-80 transition-opacity"
        >
          View all quests <ChevronRight className="w-3.5 h-3.5" />
        </Link>
      )}
    </BentoCard>
  )
}

'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { ChevronRight, Trophy } from 'lucide-react'
import { cn } from '@/lib/utils'
import { BentoCard } from '@/components/ui/BentoCard'

type AchievementRarity = 'common' | 'rare' | 'epic' | 'legendary'

interface Achievement {
  id: string
  slug: string
  title: string
  description: string
  flavor_text: string | null
  icon_key: string
  category: string
  rarity: AchievementRarity
  xp_reward: number
  coin_reward: number
  unlocked: boolean
  unlockedAt: string | null
}

const rarityColors: Record<AchievementRarity, string> = {
  common:    'border-border bg-muted text-muted-foreground',
  rare:      'border-blue-400/40 bg-blue-50/10 text-blue-500 dark:text-blue-400',
  epic:      'border-purple-400/40 bg-purple-50/10 text-purple-500 dark:text-purple-400',
  legendary: 'border-yellow-400/60 bg-yellow-50/10 text-yellow-600 dark:text-yellow-400',
}

const rarityRing: Record<AchievementRarity, string> = {
  common:    '',
  rare:      'ring-1 ring-blue-400/30',
  epic:      'ring-1 ring-purple-400/30',
  legendary: 'ring-2 ring-yellow-400/50',
}

export function AchievementShelf({ className }: { className?: string }) {
  const [achievements, setAchievements] = useState<Achievement[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [unlockedCount, setUnlockedCount] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadAchievements() {
      try {
        const res = await fetch('/api/achievements')
        if (!res.ok) return
        const json = await res.json() as {
          data?: { achievements: Achievement[]; totalCount: number; unlockedCount: number }
        }
        setAchievements(json.data?.achievements ?? [])
        setTotalCount(json.data?.totalCount ?? 0)
        setUnlockedCount(json.data?.unlockedCount ?? 0)
      } catch {
      } finally {
        setLoading(false)
      }
    }
    loadAchievements()
  }, [])

  if (loading) {
    return (
      <BentoCard padding="md" className={cn('animate-pulse', className)}>
        <div className="h-4 w-32 bg-muted rounded mb-3" />
        <div className="flex gap-2">
          {[1, 2, 3, 4, 5].map((i) => <div key={i} className="w-12 h-12 rounded-xl bg-muted" />)}
        </div>
      </BentoCard>
    )
  }

  const unlocked = achievements.filter((a) => a.unlocked)
    .sort((a, b) => new Date(b.unlockedAt ?? 0).getTime() - new Date(a.unlockedAt ?? 0).getTime())
    .slice(0, 6)

  const locked = achievements.filter((a) => !a.unlocked).slice(0, 3)

  return (
    <BentoCard padding="md" className={className}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center">
            <Trophy className="w-4 h-4 text-primary" />
          </div>
          <div>
            <h2 className="font-display text-base font-bold text-card-foreground">Achievements</h2>
            <p className="text-xs text-muted-foreground">{unlockedCount} / {totalCount} unlocked</p>
          </div>
        </div>
        <Link
          href="/achievements"
          className="text-xs font-medium text-primary hover:opacity-80 flex items-center gap-0.5"
        >
          See all <ChevronRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* Progress bar */}
      <div className="w-full h-1.5 bg-muted rounded-full mb-4 overflow-hidden">
        <div
          className="bg-primary h-full rounded-full transition-[width] duration-700"
          style={{ width: `${totalCount > 0 ? Math.round((unlockedCount / totalCount) * 100) : 0}%` }}
        />
      </div>

      {/* Recent unlocked badges */}
      {unlocked.length > 0 && (
        <div className="mb-3">
          <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">
            Recent
          </p>
          <div className="flex flex-wrap gap-2">
            {unlocked.map((ach, i) => (
              <motion.div
                key={ach.id}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.05 }}
                title={`${ach.title}: ${ach.description}`}
                className={cn(
                  'w-11 h-11 rounded-xl border flex items-center justify-center text-lg cursor-default select-none',
                  rarityColors[ach.rarity],
                  rarityRing[ach.rarity]
                )}
                aria-label={ach.title}
              >
                <AchievementIcon slug={ach.slug} />
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Locked previews */}
      {locked.length > 0 && (
        <div>
          <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">
            Up next
          </p>
          <div className="space-y-1.5">
            {locked.map((ach) => (
              <div
                key={ach.id}
                className="flex items-center gap-2.5 px-2.5 py-2 rounded-button border border-border/50 bg-muted/30"
              >
                <div className="w-8 h-8 rounded-lg bg-muted/80 flex items-center justify-center text-muted-foreground/40 text-base select-none">
                  <AchievementIcon slug={ach.slug} />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-muted-foreground truncate">{ach.title}</p>
                  <p className="text-[10px] text-muted-foreground/60 truncate">{ach.description}</p>
                </div>
                <div className="shrink-0 flex items-center gap-1">
                  {ach.xp_reward > 0 && (
                    <span className="text-[10px] text-primary font-medium">{ach.xp_reward} XP</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {unlocked.length === 0 && locked.length === 0 && (
        <p className="text-sm text-muted-foreground text-center py-4">
          Start learning to earn your first achievement.
        </p>
      )}
    </BentoCard>
  )
}

function AchievementIcon({ slug }: { slug: string }) {
  const iconMap: Record<string, string> = {
    first_light:       '✨', the_long_road:     '📖', completionist:     '🗺️',
    speed_learner:     '⚡', deep_diver:        '🌊', century_club:      '🏆',
    perfectionist:     '🎯', no_wrong_turns:    '🧭', domain_expert:     '🧠',
    flawless:          '👑', creature_of_habit: '🔥', unbreakable:       '🛡️',
    always_on:         '♾️', night_owl:         '🌙', early_bird:        '☀️',
    text_addict:       '📄', cinephile:         '🎬', multisensory:      '🎭',
    modality_switcher: '🔄', audio_explorer:    '🎧', team_player:       '👥',
    trailblazer:       '🚩', podium_finish:     '🥇', self_aware:        '👁️',
    open_book:         '📚', reflective_learner:'♻️', curious_mind:      '🔍',
    author:            '✍️', prolific:          '📑', hit_maker:         '📈',
    five_star_creator: '⭐',
  }
  return <span role="img" aria-hidden>{iconMap[slug] ?? '🎖️'}</span>
}

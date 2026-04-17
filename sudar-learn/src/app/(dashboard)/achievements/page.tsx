'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Trophy, Star, Lock } from 'lucide-react'
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
  common:    'border-border',
  rare:      'border-blue-400/50 shadow-blue-400/10',
  epic:      'border-purple-400/50 shadow-purple-400/10',
  legendary: 'border-yellow-400/60 shadow-yellow-400/20',
}

const rarityBg: Record<AchievementRarity, string> = {
  common:    'bg-muted',
  rare:      'bg-blue-50/10 dark:bg-blue-900/10',
  epic:      'bg-purple-50/10 dark:bg-purple-900/10',
  legendary: 'bg-yellow-50/10 dark:bg-yellow-900/10',
}

const rarityLabel: Record<AchievementRarity, string> = {
  common:    'Common',
  rare:      'Rare',
  epic:      'Epic',
  legendary: 'Legendary',
}

const ICON_MAP: Record<string, string> = {
  first_light:'✨', the_long_road:'📖', completionist:'🗺️', speed_learner:'⚡',
  deep_diver:'🌊', century_club:'🏆', perfectionist:'🎯', no_wrong_turns:'🧭',
  domain_expert:'🧠', flawless:'👑', creature_of_habit:'🔥', unbreakable:'🛡️',
  always_on:'♾️', night_owl:'🌙', early_bird:'☀️', text_addict:'📄',
  cinephile:'🎬', multisensory:'🎭', modality_switcher:'🔄', audio_explorer:'🎧',
  team_player:'👥', trailblazer:'🚩', podium_finish:'🥇', self_aware:'👁️',
  open_book:'📚', reflective_learner:'♻️', curious_mind:'🔍', author:'✍️',
  prolific:'📑', hit_maker:'📈', five_star_creator:'⭐',
}

const CATEGORY_ORDER = ['milestones', 'mastery', 'engagement', 'exploration', 'social', 'curiosity', 'creator']
const CATEGORY_LABELS: Record<string, string> = {
  milestones: 'Learning Milestones', mastery: 'Mastery', engagement: 'Engagement & Streaks',
  exploration: 'Exploration', social: 'Social', curiosity: 'Know Yourself', creator: 'Creator',
}

export default function AchievementsPage() {
  const [achievements, setAchievements] = useState<Achievement[]>([])
  const [unlockedCount, setUnlockedCount] = useState(0)
  const [totalCount, setTotalCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [activeCategory, setActiveCategory] = useState<string>('all')

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/achievements')
        if (!res.ok) return
        const json = await res.json() as { data?: { achievements: Achievement[]; unlockedCount: number; totalCount: number } }
        setAchievements(json.data?.achievements ?? [])
        setUnlockedCount(json.data?.unlockedCount ?? 0)
        setTotalCount(json.data?.totalCount ?? 0)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const categories = CATEGORY_ORDER.filter((cat) => achievements.some((a) => a.category === cat))
  const filtered = activeCategory === 'all' ? achievements : achievements.filter((a) => a.category === activeCategory)
  const grouped = CATEGORY_ORDER.reduce((acc, cat) => {
    const items = filtered.filter((a) => a.category === cat)
    if (items.length > 0) acc[cat] = items
    return acc
  }, {} as Record<string, Achievement[]>)

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center">
            <Trophy className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="font-display text-2xl font-bold text-card-foreground">Achievements</h1>
            <p className="text-sm text-muted-foreground">{unlockedCount} of {totalCount} unlocked</p>
          </div>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-card-foreground tabular-nums">
            {totalCount > 0 ? Math.round((unlockedCount / totalCount) * 100) : 0}%
          </div>
          <p className="text-xs text-muted-foreground">Complete</p>
        </div>
      </div>

      {/* Progress bar */}
      <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
        <div
          className="h-full bg-primary rounded-full transition-[width] duration-700"
          style={{ width: `${totalCount > 0 ? Math.round((unlockedCount / totalCount) * 100) : 0}%` }}
        />
      </div>

      {/* Category filter */}
      <div className="flex flex-wrap gap-1.5">
        <button
          onClick={() => setActiveCategory('all')}
          className={cn('px-3 py-1.5 rounded-full text-xs font-semibold transition-all',
            activeCategory === 'all' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:text-card-foreground'
          )}
        >All</button>
        {categories.map((cat) => (
          <button key={cat}
            onClick={() => setActiveCategory(cat)}
            className={cn('px-3 py-1.5 rounded-full text-xs font-semibold transition-all',
              activeCategory === cat ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:text-card-foreground'
            )}
          >{CATEGORY_LABELS[cat]}</button>
        ))}
      </div>

      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 animate-pulse">
          {[...Array(12)].map((_, i) => <div key={i} className="h-28 bg-muted rounded-card-lg" />)}
        </div>
      ) : (
        Object.entries(grouped).map(([cat, items]) => (
          <div key={cat} className="space-y-3">
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
              {CATEGORY_LABELS[cat]}
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {items.map((ach, i) => (
                <motion.div
                  key={ach.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.04 }}
                  className={cn(
                    'relative flex flex-col gap-2 p-4 rounded-card-lg border shadow-sm transition-all',
                    ach.unlocked ? `${rarityColors[ach.rarity]} ${rarityBg[ach.rarity]}` : 'border-border bg-muted/30 opacity-60'
                  )}
                >
                  {!ach.unlocked && (
                    <Lock className="absolute top-3 right-3 w-3.5 h-3.5 text-muted-foreground/40" />
                  )}
                  <div className="flex items-start gap-2.5">
                    <span className="text-2xl shrink-0" role="img" aria-label={ach.title}>
                      {ach.unlocked ? (ICON_MAP[ach.slug] ?? '🎖️') : '🔒'}
                    </span>
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-card-foreground leading-tight">{ach.title}</p>
                      <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed line-clamp-2">
                        {ach.unlocked && ach.flavor_text ? ach.flavor_text : ach.description}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between mt-auto pt-2 border-t border-border/30">
                    <span className={cn('text-[10px] font-bold uppercase tracking-wider',
                      ach.rarity === 'legendary' ? 'text-yellow-500' :
                      ach.rarity === 'epic' ? 'text-purple-500' :
                      ach.rarity === 'rare' ? 'text-blue-500' : 'text-muted-foreground'
                    )}>
                      {rarityLabel[ach.rarity]}
                    </span>
                    <div className="flex items-center gap-2">
                      {ach.xp_reward > 0 && (
                        <span className="flex items-center gap-0.5 text-[10px] text-primary font-semibold">
                          <Star className="w-2.5 h-2.5" />{ach.xp_reward}
                        </span>
                      )}
                      {ach.coin_reward > 0 && (
                        <span className="text-[10px] font-semibold text-yellow-600 dark:text-yellow-400">
                          ⬡{ach.coin_reward}
                        </span>
                      )}
                    </div>
                  </div>
                  {ach.unlocked && ach.unlockedAt && (
                    <p className="text-[10px] text-muted-foreground/60 mt-0.5">
                      {new Date(ach.unlockedAt).toLocaleDateString()}
                    </p>
                  )}
                </motion.div>
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  )
}

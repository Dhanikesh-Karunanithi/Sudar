'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Award, Sparkles, TrendingUp, X } from 'lucide-react'

type ToastKind = 'level-up' | 'achievement'

interface ToastItem {
  id: string
  kind: ToastKind
  title: string
  subtitle: string
}

interface AchievementUnlock {
  id: string
  title: string
  rarity: 'common' | 'rare' | 'epic' | 'legendary'
}

const rarityCopy: Record<AchievementUnlock['rarity'], string> = {
  common: 'Common badge unlocked',
  rare: 'Rare badge unlocked',
  epic: 'Epic badge unlocked',
  legendary: 'Legendary badge unlocked',
}

export function GamificationToasts() {
  const [queue, setQueue] = useState<ToastItem[]>([])
  const [visible, setVisible] = useState<ToastItem | null>(null)
  const [reduceMotion, setReduceMotion] = useState(false)
  const levelRef = useRef<number | null>(null)
  const seenAchievements = useRef<Set<string>>(new Set())

  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)')
    const update = () => setReduceMotion(media.matches)
    update()
    media.addEventListener('change', update)
    return () => media.removeEventListener('change', update)
  }, [])

  useEffect(() => {
    if (!visible && queue.length > 0) {
      const [next, ...rest] = queue
      setVisible(next)
      setQueue(rest)
    }
  }, [queue, visible])

  useEffect(() => {
    if (!visible) return
    const timeout = setTimeout(() => setVisible(null), 3500)
    return () => clearTimeout(timeout)
  }, [visible])

  useEffect(() => {
    let mounted = true

    async function poll() {
      try {
        const [coinsRes, achievementsRes] = await Promise.all([
          fetch('/api/coins/balance', { cache: 'no-store' }),
          fetch('/api/achievements', { cache: 'no-store' }),
        ])
        if (!mounted || !coinsRes.ok || !achievementsRes.ok) return

        const coinsJson = await coinsRes.json() as { data?: { level?: number; title?: string } }
        const achievementsJson = await achievementsRes.json() as {
          data?: { newUnlocks?: Array<{ id: string; title: string; rarity: AchievementUnlock['rarity'] }> }
        }

        const nextToasts: ToastItem[] = []

        const currentLevel = coinsJson.data?.level ?? null
        const currentTitle = coinsJson.data?.title ?? 'Scholar'
        if (levelRef.current !== null && currentLevel !== null && currentLevel > levelRef.current) {
          nextToasts.push({
            id: `lvl-${Date.now()}`,
            kind: 'level-up',
            title: `Level ${currentLevel} reached`,
            subtitle: `You are now ${currentTitle}.`,
          })
        }
        if (currentLevel !== null) levelRef.current = currentLevel

        const newUnlocks = achievementsJson.data?.newUnlocks ?? []
        for (const ach of newUnlocks) {
          if (seenAchievements.current.has(ach.id)) continue
          seenAchievements.current.add(ach.id)
          nextToasts.push({
            id: `ach-${ach.id}`,
            kind: 'achievement',
            title: ach.title,
            subtitle: rarityCopy[ach.rarity],
          })
        }

        if (nextToasts.length > 0) {
          setQueue((prev) => [...prev, ...nextToasts])
        }
      } catch {
        // best-effort notification layer
      }
    }

    poll()
    const interval = setInterval(poll, 20000)
    return () => {
      mounted = false
      clearInterval(interval)
    }
  }, [])

  const icon = useMemo(() => {
    if (!visible) return null
    return visible.kind === 'level-up' ? <TrendingUp className="h-4 w-4" /> : <Award className="h-4 w-4" />
  }, [visible])

  return (
    <div className="pointer-events-none fixed bottom-4 right-4 z-[60]">
      <AnimatePresence>
        {visible && (
          <motion.div
            key={visible.id}
            initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 20, scale: 0.98 }}
            animate={reduceMotion ? { opacity: 1 } : { opacity: 1, y: 0, scale: 1 }}
            exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 8, scale: 0.98 }}
            transition={{ duration: 0.2 }}
            className="pointer-events-auto w-[320px] rounded-2xl border border-primary/20 bg-card p-3 shadow-xl"
            role="status"
            aria-live="polite"
          >
            <div className="flex items-start gap-3">
              <div className="mt-0.5 rounded-lg bg-primary/10 p-2 text-primary">
                {icon}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-card-foreground">{visible.title}</p>
                <p className="text-xs text-muted-foreground">{visible.subtitle}</p>
              </div>
              <button
                type="button"
                onClick={() => setVisible(null)}
                className="rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-card-foreground"
                aria-label="Dismiss notification"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
            {visible.kind === 'level-up' && (
              <div className="mt-2 flex items-center gap-1 text-[11px] text-primary">
                <Sparkles className="h-3.5 w-3.5" />
                Keep going to unlock the next rank.
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}


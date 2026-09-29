'use client'

import { useEffect, useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Award, Sparkles, TrendingUp, X } from 'lucide-react'
import { useNotificationSound } from '@/components/features/notifications/NotificationSoundProvider'
import {
  useGamificationSyncStore,
  type GamificationToastItem,
} from '@/lib/gamification/gamificationSyncStore'

export function GamificationToasts() {
  const { playChime } = useNotificationSound()
  const toastQueue = useGamificationSyncStore((s) => s.toastQueue)
  const shiftToast = useGamificationSyncStore((s) => s.shiftToast)
  const [visible, setVisible] = useState<GamificationToastItem | null>(null)
  const [reduceMotion, setReduceMotion] = useState(false)

  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)')
    const update = () => setReduceMotion(media.matches)
    update()
    media.addEventListener('change', update)
    return () => media.removeEventListener('change', update)
  }, [])

  useEffect(() => {
    if (!visible && toastQueue.length > 0) {
      const next = shiftToast()
      if (next) {
        setVisible(next)
        playChime('celebration')
      }
    }
  }, [toastQueue, visible, playChime, shiftToast])

  useEffect(() => {
    if (!visible) return
    const timeout = setTimeout(() => setVisible(null), 3500)
    return () => clearTimeout(timeout)
  }, [visible])

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

'use client'

import { useEffect } from 'react'
import {
  GAMIFICATION_POLL_MS,
  useGamificationSyncStore,
  type AchievementUnlock,
} from '@/lib/gamification/gamificationSyncStore'

/**
 * Single dashboard poller for coins + achievements.
 * Pauses when the tab is hidden; refreshes once when visible again.
 */
export function GamificationSyncHost({ initialBalance = 0 }: { initialBalance?: number }) {
  const setBalanceSeed = useGamificationSyncStore((s) => s.setBalanceSeed)
  const applyPoll = useGamificationSyncStore((s) => s.applyPoll)

  useEffect(() => {
    setBalanceSeed(initialBalance)
  }, [initialBalance, setBalanceSeed])

  useEffect(() => {
    let mounted = true
    let interval: ReturnType<typeof setInterval> | null = null

    async function poll() {
      if (typeof document !== 'undefined' && document.visibilityState !== 'visible') return
      try {
        const [coinsRes, achievementsRes] = await Promise.all([
          fetch('/api/coins/balance', { cache: 'no-store' }),
          fetch('/api/achievements', { cache: 'no-store' }),
        ])
        if (!mounted || !coinsRes.ok || !achievementsRes.ok) return

        const coinsJson = await coinsRes.json() as {
          data?: { balance?: number; level?: number; title?: string }
        }
        const achievementsJson = await achievementsRes.json() as {
          data?: { newUnlocks?: AchievementUnlock[] }
        }

        applyPoll({
          balance: coinsJson.data?.balance,
          level: coinsJson.data?.level ?? null,
          title: coinsJson.data?.title,
          newUnlocks: achievementsJson.data?.newUnlocks ?? [],
        })
      } catch {
        // best-effort sync
      }
    }

    function startInterval() {
      if (interval) clearInterval(interval)
      interval = null
      if (typeof document !== 'undefined' && document.visibilityState !== 'visible') return
      interval = setInterval(poll, GAMIFICATION_POLL_MS)
    }

    function onVisibility() {
      if (document.visibilityState === 'visible') {
        void poll()
        startInterval()
      } else if (interval) {
        clearInterval(interval)
        interval = null
      }
    }

    void poll()
    startInterval()
    document.addEventListener('visibilitychange', onVisibility)
    return () => {
      mounted = false
      document.removeEventListener('visibilitychange', onVisibility)
      if (interval) clearInterval(interval)
    }
  }, [applyPoll])

  return null
}

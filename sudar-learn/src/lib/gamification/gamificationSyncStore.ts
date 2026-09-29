/**
 * Shared gamification state — one poller for balance + achievements across TopNav and toasts.
 */
import { create } from 'zustand'

export type AchievementUnlock = {
  id: string
  title: string
  rarity: 'common' | 'rare' | 'epic' | 'legendary'
}

export type GamificationToastItem = {
  id: string
  kind: 'level-up' | 'achievement'
  title: string
  subtitle: string
}

type GamificationSyncState = {
  balance: number
  level: number | null
  title: string
  toastQueue: GamificationToastItem[]
  setBalanceSeed: (balance: number) => void
  applyPoll: (data: {
    balance?: number
    level?: number | null
    title?: string
    newUnlocks?: AchievementUnlock[]
  }) => void
  shiftToast: () => GamificationToastItem | undefined
  enqueueToasts: (items: GamificationToastItem[]) => void
}

const rarityCopy: Record<AchievementUnlock['rarity'], string> = {
  common: 'Common badge unlocked',
  rare: 'Rare badge unlocked',
  epic: 'Epic badge unlocked',
  legendary: 'Legendary badge unlocked',
}

let lastKnownLevel: number | null = null
const seenAchievements = new Set<string>()

export const useGamificationSyncStore = create<GamificationSyncState>((set, get) => ({
  balance: 0,
  level: null,
  title: 'Scholar',
  toastQueue: [],

  setBalanceSeed: (balance) => set({ balance }),

  applyPoll: ({ balance, level, title, newUnlocks }) => {
    const nextToasts: GamificationToastItem[] = []
    const currentLevel = level ?? null
    const currentTitle = title ?? 'Scholar'

    if (lastKnownLevel !== null && currentLevel !== null && currentLevel > lastKnownLevel) {
      nextToasts.push({
        id: `lvl-${Date.now()}`,
        kind: 'level-up',
        title: `Level ${currentLevel} reached`,
        subtitle: `You are now ${currentTitle}.`,
      })
    }
    if (currentLevel !== null) lastKnownLevel = currentLevel

    for (const ach of newUnlocks ?? []) {
      if (seenAchievements.has(ach.id)) continue
      seenAchievements.add(ach.id)
      nextToasts.push({
        id: `ach-${ach.id}`,
        kind: 'achievement',
        title: ach.title,
        subtitle: rarityCopy[ach.rarity],
      })
    }

    set((state) => ({
      balance: typeof balance === 'number' ? balance : state.balance,
      level: currentLevel ?? state.level,
      title: currentTitle,
      toastQueue: nextToasts.length > 0 ? [...state.toastQueue, ...nextToasts] : state.toastQueue,
    }))
  },

  shiftToast: () => {
    const [next, ...rest] = get().toastQueue
    set({ toastQueue: rest })
    return next
  },

  enqueueToasts: (items) => {
    if (items.length === 0) return
    set((state) => ({ toastQueue: [...state.toastQueue, ...items] }))
  },
}))

export const GAMIFICATION_POLL_MS = 30_000

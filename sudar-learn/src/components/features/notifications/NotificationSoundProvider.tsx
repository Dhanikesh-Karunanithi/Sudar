'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import {
  DEFAULT_NOTIFICATION_SOUND_PREFS,
  parseSoundPrefsFromSettings,
  playSudarChime,
  unlockNotificationAudio,
  type NotificationSoundPrefs,
  type SoundEventGroup,
} from '../../../../../shared/notifications/sound'

interface NotificationSoundContextValue {
  prefs: NotificationSoundPrefs
  playChime: (group: SoundEventGroup) => void
  previewChime: (group: SoundEventGroup) => void
  refreshPrefs: () => Promise<void>
  setPrefsLocal: (next: Partial<NotificationSoundPrefs>) => void
}

const NotificationSoundContext = createContext<NotificationSoundContextValue | null>(null)

export function NotificationSoundProvider({ children }: { children: ReactNode }) {
  const [prefs, setPrefs] = useState<NotificationSoundPrefs>(DEFAULT_NOTIFICATION_SOUND_PREFS)
  const unlockBound = useRef(false)

  const refreshPrefs = useCallback(async () => {
    try {
      const res = await fetch('/api/learner/notification-settings', { cache: 'no-store' })
      if (!res.ok) return
      const data = (await res.json()) as { settings?: Record<string, unknown> }
      setPrefs(parseSoundPrefsFromSettings(data.settings))
    } catch {
      /* ignore */
    }
  }, [])

  useEffect(() => {
    void refreshPrefs()
  }, [refreshPrefs])

  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === 'visible') void refreshPrefs()
    }
    document.addEventListener('visibilitychange', onVisible)
    return () => document.removeEventListener('visibilitychange', onVisible)
  }, [refreshPrefs])

  useEffect(() => {
    if (unlockBound.current) return
    const unlock = () => {
      unlockNotificationAudio()
      unlockBound.current = true
      document.removeEventListener('pointerdown', unlock)
      document.removeEventListener('keydown', unlock)
    }
    document.addEventListener('pointerdown', unlock, { once: true })
    document.addEventListener('keydown', unlock, { once: true })
    return () => {
      document.removeEventListener('pointerdown', unlock)
      document.removeEventListener('keydown', unlock)
    }
  }, [])

  const playChime = useCallback(
    (group: SoundEventGroup) => {
      playSudarChime({ group, prefs })
    },
    [prefs]
  )

  const previewChime = useCallback(
    (group: SoundEventGroup) => {
      unlockNotificationAudio()
      playSudarChime({ group, prefs, skipDebounce: true, ignoreQuietHours: true })
    },
    [prefs]
  )

  const setPrefsLocal = useCallback((next: Partial<NotificationSoundPrefs>) => {
    setPrefs((curr) => ({ ...curr, ...next }))
  }, [])

  const value = useMemo(
    () => ({ prefs, playChime, previewChime, refreshPrefs, setPrefsLocal }),
    [prefs, playChime, previewChime, refreshPrefs, setPrefsLocal]
  )

  return (
    <NotificationSoundContext.Provider value={value}>{children}</NotificationSoundContext.Provider>
  )
}

export function useNotificationSound(): NotificationSoundContextValue {
  const ctx = useContext(NotificationSoundContext)
  if (!ctx) {
    throw new Error('useNotificationSound must be used within NotificationSoundProvider')
  }
  return ctx
}

/** Safe hook for components that may render outside the provider (no-op play). */
export function useNotificationSoundOptional(): NotificationSoundContextValue | null {
  return useContext(NotificationSoundContext)
}

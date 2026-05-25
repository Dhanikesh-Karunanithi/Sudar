'use client'

import { useCallback, useState } from 'react'

import { NOTIFICATION_ICON_PATH } from '../../../shared/notifications/notificationIconPath'
import {
  DEFAULT_NOTIFICATION_SOUND_PREFS,
  playSudarChime,
  unlockNotificationAudio,
  type NotificationSoundPrefs,
} from '../../../shared/notifications/sound'

const STORAGE_KEY = 'studio_notify_when_course_ready'
const STORAGE_KEY_SOUND = 'studio_sound_enabled'
const STORAGE_KEY_SOUND_VOLUME = 'studio_sound_volume'

function notificationIconAbsoluteUrl(): string | undefined {
  if (typeof window === 'undefined') return undefined
  return new URL(NOTIFICATION_ICON_PATH, window.location.origin).href
}

/**
 * Uses the browser’s built-in Web Notifications API (Notification.requestPermission + new Notification).
 * Those surface as normal OS/desktop notifications when permission is granted.
 */
function notificationsAvailable(): boolean {
  if (typeof window === 'undefined') return false
  if (!('Notification' in window)) return false
  // Required for notifications in Chromium-based browsers outside localhost.
  if (!window.isSecureContext) return false
  return true
}

function readStoredPreference(): boolean {
  if (typeof window === 'undefined') return false
  try {
    return window.localStorage.getItem(STORAGE_KEY) === '1'
  } catch {
    return false
  }
}

function readSoundEnabled(): boolean {
  if (typeof window === 'undefined') return false
  try {
    return window.localStorage.getItem(STORAGE_KEY_SOUND) === '1'
  } catch {
    return false
  }
}

function readSoundVolume(): number {
  if (typeof window === 'undefined') return DEFAULT_NOTIFICATION_SOUND_PREFS.sound_volume
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY_SOUND_VOLUME)
    const n = raw != null ? Number(raw) : NaN
    if (Number.isFinite(n)) return Math.max(0, Math.min(100, n))
  } catch {
    /* ignore */
  }
  return DEFAULT_NOTIFICATION_SOUND_PREFS.sound_volume
}

function persistPreference(enabled: boolean): void {
  try {
    if (enabled) window.localStorage.setItem(STORAGE_KEY, '1')
    else window.localStorage.removeItem(STORAGE_KEY)
  } catch {
    /* ignore quota / private mode */
  }
}

function persistSoundEnabled(enabled: boolean): void {
  try {
    if (enabled) window.localStorage.setItem(STORAGE_KEY_SOUND, '1')
    else window.localStorage.removeItem(STORAGE_KEY_SOUND)
  } catch {
    /* ignore */
  }
}

function persistSoundVolume(volume: number): void {
  try {
    window.localStorage.setItem(STORAGE_KEY_SOUND_VOLUME, String(Math.max(0, Math.min(100, volume))))
  } catch {
    /* ignore */
  }
}

function studioSoundPrefs(enabled: boolean, volume: number): NotificationSoundPrefs {
  return {
    ...DEFAULT_NOTIFICATION_SOUND_PREFS,
    sound_enabled: enabled,
    sound_volume: volume,
    sound_task_complete: true,
    sound_sudar_reply: false,
    sound_notifications: false,
    sound_celebration: false,
  }
}

function showBrowserNotification(title: string, options: NotificationOptions): void {
  const icon = notificationIconAbsoluteUrl()
  const n = new Notification(title, {
    ...options,
    ...(icon ? { icon, badge: icon } : {}),
    silent: false,
  })
  n.onclick = () => {
    try {
      window.focus()
    } catch {
      /* ignore */
    }
    n.close()
  }
}

export function useBrowserCompletionNotification() {
  const [notifyWhenReady, setNotifyWhenReady] = useState(() => readStoredPreference())
  const [soundWhenReady, setSoundWhenReady] = useState(() => readSoundEnabled())
  const [soundVolume, setSoundVolume] = useState(() => readSoundVolume())

  const toggleNotifyWhenReady = useCallback(async (checked: boolean) => {
    setNotifyWhenReady(checked)
    persistPreference(checked)
    if (!checked || !notificationsAvailable()) return
    if (Notification.permission === 'default') {
      await Notification.requestPermission()
    }
  }, [])

  const toggleSoundWhenReady = useCallback((checked: boolean) => {
    setSoundWhenReady(checked)
    persistSoundEnabled(checked)
    if (checked) unlockNotificationAudio()
  }, [])

  const updateSoundVolume = useCallback((volume: number) => {
    const v = Math.max(0, Math.min(100, volume))
    setSoundVolume(v)
    persistSoundVolume(v)
  }, [])

  const previewTaskCompleteSound = useCallback(() => {
    unlockNotificationAudio()
    playSudarChime({
      group: 'task_complete',
      prefs: studioSoundPrefs(true, soundVolume),
      skipDebounce: true,
      ignoreQuietHours: true,
    })
  }, [soundVolume])

  const canFire = notifyWhenReady && notificationsAvailable() && Notification.permission === 'granted'

  const playCourseReadyChime = useCallback(() => {
    if (!soundWhenReady) return
    playSudarChime({
      group: 'task_complete',
      prefs: studioSoundPrefs(true, soundVolume),
    })
  }, [soundWhenReady, soundVolume])

  const notifyCourseReady = useCallback(
    (courseTitle: string) => {
      playCourseReadyChime()
      if (!canFire) return
      try {
        const safe = courseTitle.trim() || 'Your course'
        showBrowserNotification('Course ready in Sudar Studio', {
          body: `${safe.length > 140 ? `${safe.slice(0, 137)}…` : safe} is ready to open.`,
          tag: 'sudar-course-ready',
        })
      } catch {
        /* invalid Notification options in some environments */
      }
    },
    [canFire, playCourseReadyChime]
  )

  const notifyCourseFailed = useCallback(
    (courseTitle: string, detail?: string) => {
      if (!canFire) return
      try {
        const safe = courseTitle.trim() || 'Course'
        showBrowserNotification('Course generation did not finish', {
          body: detail ?? `Something went wrong while generating “${safe.length > 80 ? `${safe.slice(0, 77)}…` : safe}”.`,
          tag: 'sudar-course-failed',
        })
      } catch {
        /* ignore */
      }
    },
    [canFire]
  )

  const notificationsMissingApi =
    typeof window !== 'undefined' && !('Notification' in window)
  const notificationsNeedSecurePage =
    typeof window !== 'undefined' &&
    'Notification' in window &&
    !window.isSecureContext

  return {
    notifyWhenReady,
    toggleNotifyWhenReady,
    soundWhenReady,
    toggleSoundWhenReady,
    soundVolume,
    updateSoundVolume,
    previewTaskCompleteSound,
    notifyCourseReady,
    notifyCourseFailed,
    /** True when this browser has no Notification API (not the same as needing HTTPS). */
    notificationsMissingApi,
    notificationsNeedSecurePage,
    /** Checkbox / prompts: no API, or not HTTPS/localhost. */
    notificationsUnavailable: !notificationsAvailable(),
    notificationPermissionDenied: notificationsAvailable() && Notification.permission === 'denied',
  }
}

'use client'

import { useCallback, useState } from 'react'

import { NOTIFICATION_ICON_PATH } from '../../../shared/notifications/notificationIconPath'

const STORAGE_KEY = 'studio_notify_when_course_ready'

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

function persistPreference(enabled: boolean): void {
  try {
    if (enabled) window.localStorage.setItem(STORAGE_KEY, '1')
    else window.localStorage.removeItem(STORAGE_KEY)
  } catch {
    /* ignore quota / private mode */
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

  const toggleNotifyWhenReady = useCallback(async (checked: boolean) => {
    setNotifyWhenReady(checked)
    persistPreference(checked)
    if (!checked || !notificationsAvailable()) return
    if (Notification.permission === 'default') {
      await Notification.requestPermission()
    }
  }, [])

  const canFire = notifyWhenReady && notificationsAvailable() && Notification.permission === 'granted'

  const notifyCourseReady = useCallback(
    (courseTitle: string) => {
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
    [canFire]
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

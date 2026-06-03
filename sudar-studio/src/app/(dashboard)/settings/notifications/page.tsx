'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Bell, Volume2, ArrowLeft, Save, AlertCircle } from 'lucide-react'
import { SudarInlineLoader, SudarLoadingFrost } from '@/components/branding/SudarBrandLoader'
import { cn } from '@/lib/utils'

interface NotificationPreferences {
  notify_when_course_ready: boolean
  sound_when_course_ready: boolean
  sound_volume: number
}

export default function NotificationsSettingsPage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [notifyWhenCourseReady, setNotifyWhenCourseReady] = useState(false)
  const [soundWhenCourseReady, setSoundWhenCourseReady] = useState(false)
  const [soundVolume, setSoundVolume] = useState(50)
  const [notificationsUnavailable, setNotificationsUnavailable] = useState(false)
  const [notificationPermissionDenied, setNotificationPermissionDenied] = useState(false)
  const [notificationsMissingApi, setNotificationsMissingApi] = useState(false)

  function notificationsAvailable(): boolean {
    if (typeof window === 'undefined') return false
    if (!('Notification' in window)) return false
    if (!window.isSecureContext) return false
    return true
  }

  useEffect(() => {
    async function fetchSettings() {
      try {
        const res = await fetch('/api/user/notification-preferences')
        if (res.ok) {
          const data = (await res.json()) as { preferences: NotificationPreferences }
          setNotifyWhenCourseReady(data.preferences.notify_when_course_ready)
          setSoundWhenCourseReady(data.preferences.sound_when_course_ready)
          setSoundVolume(data.preferences.sound_volume)
        }
      } catch {
        /* ignore */
      } finally {
        setLoading(false)
      }

      if (typeof window !== 'undefined') {
        setNotificationsMissingApi(!('Notification' in window))
        setNotificationsUnavailable(!notificationsAvailable())
        setNotificationPermissionDenied(notificationsAvailable() && Notification.permission === 'denied')
      }
    }
    fetchSettings()
  }, [])

  async function handleSave() {
    setSaving(true)
    setSaved(false)
    try {
      const res = await fetch('/api/user/notification-preferences', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          notify_when_course_ready: notifyWhenCourseReady,
          sound_when_course_ready: soundWhenCourseReady,
          sound_volume: soundVolume,
        }),
      })
      if (res.ok) {
        setSaved(true)
        setTimeout(() => setSaved(false), 2000)
      }
    } catch {
      /* ignore */
    } finally {
      setSaving(false)
    }
  }

  async function handleNotifyToggle(checked: boolean) {
    setNotifyWhenCourseReady(checked)
    if (checked && notificationsAvailable()) {
      if (Notification.permission === 'default') {
        await Notification.requestPermission()
      }
    }
  }

  if (loading) {
    return (
      <div className="relative p-8 min-h-[min(50vh,420px)] overflow-hidden rounded-2xl">
        <SudarLoadingFrost label="Loading notification settings…" className="rounded-2xl" />
      </div>
    )
  }

  return (
    <div className="p-8 max-w-2xl mx-auto space-y-6">
      <Link
        href="/settings"
        className="inline-flex items-center gap-2 text-slate-400 hover:text-slate-200 text-sm transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to settings
      </Link>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-violet-500/15 border border-violet-500/30 flex items-center justify-center">
            <Bell className="w-6 h-6 text-violet-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Notifications</h1>
            <p className="text-slate-400 text-sm">
              Configure how you are notified when courses finish generating
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white text-sm font-medium"
        >
          {saving ? (
            <SudarInlineLoader size="sm" className="text-white" starFill="#7c3aed" />
          ) : (
            <Save className="w-4 h-4" />
          )}
          {saved ? 'Saved' : 'Save'}
        </button>
      </div>

      <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-6 space-y-4">
        <div>
          <h2 className="font-semibold text-white mb-1">Browser notifications</h2>
          <p className="text-slate-500 text-sm">
            Receive desktop notifications when your courses finish generating, just like other websites.
            You can work on other tabs or applications and still be notified.
          </p>
        </div>

        <div className="space-y-3">
          <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-slate-700/80 bg-slate-800/40 px-3.5 py-3">
            <input
              type="checkbox"
              checked={notifyWhenCourseReady}
              onChange={(e) => void handleNotifyToggle(e.target.checked)}
              disabled={notificationsUnavailable}
              className="mt-0.5 rounded border-slate-600 bg-slate-800 text-violet-600 focus:ring-violet-500/30 disabled:opacity-40"
              aria-label="Notify me in the browser when generation finishes"
            />
            <span className="min-w-0 flex-1">
              <span className="flex items-center gap-2 text-sm font-medium text-slate-200">
                <Bell className="h-4 w-4 shrink-0 text-violet-400" aria-hidden />
                Desktop notification
              </span>
              <span className="mt-1 block text-xs text-slate-500">
                Show a system notification when course generation completes
              </span>
              {notificationsUnavailable && (
                <span className="mt-2 flex items-start gap-2 text-xs text-amber-400/90">
                  <AlertCircle className="w-3 h-3 shrink-0 mt-0.5" />
                  <span>
                    {notificationsMissingApi
                      ? 'Your browser does not support notifications.'
                      : 'Open Sudar Studio over HTTPS or localhost so the browser can show notifications.'}
                  </span>
                </span>
              )}
              {notificationPermissionDenied && (
                <span className="mt-2 flex items-start gap-2 text-xs text-amber-400/90">
                  <AlertCircle className="w-3 h-3 shrink-0 mt-0.5" />
                  <span>
                    Notifications are blocked for this site. Enable them in your browser settings to use this option.
                  </span>
                </span>
              )}
            </span>
          </label>

          <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-slate-700/80 bg-slate-800/40 px-3.5 py-3">
            <input
              type="checkbox"
              checked={soundWhenCourseReady}
              onChange={(e) => setSoundWhenCourseReady(e.target.checked)}
              className="mt-0.5 rounded border-slate-600 bg-slate-800 text-violet-600 focus:ring-violet-500/30"
              aria-label="Play a subtle chime when generation finishes"
            />
            <span className="min-w-0 flex-1">
              <span className="flex items-center gap-2 text-sm font-medium text-slate-200">
                <Volume2 className="h-4 w-4 shrink-0 text-violet-400" aria-hidden />
                In-tab chime
              </span>
              <span className="mt-1 block text-xs text-slate-500">
                Play a subtle sound while Sudar Studio is open (separate from system notifications)
              </span>
              {soundWhenCourseReady && (
                <div className="mt-3 space-y-2">
                  <label className="block text-xs text-slate-400">
                    Volume ({soundVolume}%)
                    <input
                      type="range"
                      min={0}
                      max={100}
                      value={soundVolume}
                      onChange={(e) => setSoundVolume(Number(e.target.value))}
                      className="mt-1 w-full"
                    />
                  </label>
                </div>
              )}
            </span>
          </label>
        </div>
      </div>

      <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-6 space-y-4">
        <h3 className="font-semibold text-white">When notifications are fired</h3>
        <ul className="space-y-2 text-sm text-slate-400">
          <li className="flex gap-2">
            <span className="text-violet-400 shrink-0">•</span>
            <span>Course generation completes (success)</span>
          </li>
          <li className="flex gap-2">
            <span className="text-violet-400 shrink-0">•</span>
            <span>Document import finishes</span>
          </li>
          <li className="flex gap-2">
            <span className="text-violet-400 shrink-0">•</span>
            <span>Generation fails with an error</span>
          </li>
        </ul>
      </div>
    </div>
  )
}

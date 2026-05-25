'use client'

import { useEffect, useMemo, useState } from 'react'
import { Bell, Volume2 } from 'lucide-react'
import { registerServiceWorkerAndSubscribe, unsubscribeWebPush } from '@/lib/notifications/webPush'
import { useNotificationSound } from '@/components/features/notifications/NotificationSoundProvider'
import type { SoundEventGroup } from '../../../../../../shared/notifications/sound'

type FrequencyMode = 'minimal' | 'balanced' | 'high'

interface PrefRow {
  category_slug: string
  channel: string
  enabled: boolean
}

async function requestForegroundNotificationPermission(): Promise<NotificationPermission | 'unsupported'> {
  if (typeof window === 'undefined' || !('Notification' in window) || !window.isSecureContext) return 'unsupported'
  if (Notification.permission === 'default') return Notification.requestPermission()
  return Notification.permission
}

const SOUND_GROUPS: Array<{ id: SoundEventGroup; label: string; hint: string }> = [
  { id: 'task_complete', label: 'Task complete', hint: 'When AI finishes generating content (video, cards, audio, etc.)' },
  { id: 'sudar_reply', label: 'Sudar reply', hint: 'When Sudar finishes answering in chat' },
  { id: 'notification', label: 'Notifications', hint: 'In-app alerts from missions, assignments, and updates' },
  { id: 'celebration', label: 'Celebrations', hint: 'Level-ups, achievements, and coin moments' },
]

export default function NotificationSettingsPage() {
  const { previewChime, setPrefsLocal } = useNotificationSound()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [categories, setCategories] = useState<string[]>([])
  const [preferences, setPreferences] = useState<PrefRow[]>([])
  const [timezone, setTimezone] = useState('UTC')
  const [quietStart, setQuietStart] = useState('22:00')
  const [quietEnd, setQuietEnd] = useState('07:00')
  const [frequencyMode, setFrequencyMode] = useState<FrequencyMode>('balanced')
  const [dailyDigest, setDailyDigest] = useState(false)
  const [activity, setActivity] = useState({ sent: 0, opened: 0, suppressed: 0 })
  const [coinPreview, setCoinPreview] = useState({ balance: 0, opt_in_bonus_awarded_at: null as string | null })
  const [webPushEnabled, setWebPushEnabled] = useState(false)
  const [soundEnabled, setSoundEnabled] = useState(false)
  const [soundVolume, setSoundVolume] = useState(50)
  const [soundTaskComplete, setSoundTaskComplete] = useState(true)
  const [soundSudarReply, setSoundSudarReply] = useState(true)
  const [soundNotifications, setSoundNotifications] = useState(true)
  const [soundCelebration, setSoundCelebration] = useState(true)

  useEffect(() => {
    async function load() {
      const res = await fetch('/api/learner/notification-settings')
      if (!res.ok) return
      const data = await res.json()
      setCategories(data.categories ?? [])
      setPreferences(data.preferences ?? [])
      setTimezone(data.settings?.timezone ?? 'UTC')
      setQuietStart(data.settings?.quiet_hours_start ?? '22:00')
      setQuietEnd(data.settings?.quiet_hours_end ?? '07:00')
      setFrequencyMode((data.settings?.frequency_mode as FrequencyMode) ?? 'balanced')
      setDailyDigest(!!data.settings?.daily_digest_email)
      setActivity(data.activity ?? { sent: 0, opened: 0, suppressed: 0 })
      setCoinPreview(data.coin_preview ?? { balance: 0, opt_in_bonus_awarded_at: null })
      setWebPushEnabled(!!data.channel_status?.web_push_enabled)
      setSoundEnabled(!!data.settings?.sound_enabled)
      setSoundVolume(typeof data.settings?.sound_volume === 'number' ? data.settings.sound_volume : 50)
      setSoundTaskComplete(data.settings?.sound_task_complete !== false)
      setSoundSudarReply(data.settings?.sound_sudar_reply !== false)
      setSoundNotifications(data.settings?.sound_notifications !== false)
      setSoundCelebration(data.settings?.sound_celebration !== false)
      setPrefsLocal({
        sound_enabled: !!data.settings?.sound_enabled,
        sound_volume: typeof data.settings?.sound_volume === 'number' ? data.settings.sound_volume : 50,
        sound_task_complete: data.settings?.sound_task_complete !== false,
        sound_sudar_reply: data.settings?.sound_sudar_reply !== false,
        sound_notifications: data.settings?.sound_notifications !== false,
        sound_celebration: data.settings?.sound_celebration !== false,
        timezone: data.settings?.timezone ?? 'UTC',
        quiet_hours_start: data.settings?.quiet_hours_start ?? null,
        quiet_hours_end: data.settings?.quiet_hours_end ?? null,
      })
      setLoading(false)
    }
    void load()
  }, [])

  const channels = useMemo(() => ['in_app', 'web_push', 'email'], [])

  function isEnabled(category: string, channel: string): boolean {
    const found = preferences.find((p) => p.category_slug === category && p.channel === channel)
    return found ? found.enabled : true
  }

  function toggle(category: string, channel: string, enabled: boolean) {
    setPreferences((curr) => {
      const idx = curr.findIndex((p) => p.category_slug === category && p.channel === channel)
      if (idx >= 0) {
        const next = [...curr]
        next[idx] = { ...next[idx], enabled }
        return next
      }
      return [...curr, { category_slug: category, channel, enabled }]
    })
  }

  async function save() {
    setSaving(true)
    await fetch('/api/learner/notification-settings', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        settings: {
          timezone,
          quiet_hours_start: quietStart,
          quiet_hours_end: quietEnd,
          frequency_mode: frequencyMode,
          daily_digest_email: dailyDigest,
          sound_enabled: soundEnabled,
          sound_volume: soundVolume,
          sound_task_complete: soundTaskComplete,
          sound_sudar_reply: soundSudarReply,
          sound_notifications: soundNotifications,
          sound_celebration: soundCelebration,
        },
        preferences,
      }),
    })
    setPrefsLocal({
      sound_enabled: soundEnabled,
      sound_volume: soundVolume,
      sound_task_complete: soundTaskComplete,
      sound_sudar_reply: soundSudarReply,
      sound_notifications: soundNotifications,
      sound_celebration: soundCelebration,
      timezone,
      quiet_hours_start: quietStart,
      quiet_hours_end: quietEnd,
    })
    setSaving(false)
  }

  function updateSoundEnabled(enabled: boolean) {
    setSoundEnabled(enabled)
    setPrefsLocal({ sound_enabled: enabled })
  }

  function updateSoundVolume(volume: number) {
    setSoundVolume(volume)
    setPrefsLocal({ sound_volume: volume })
  }

  async function enablePush() {
    await requestForegroundNotificationPermission()
    const result = await registerServiceWorkerAndSubscribe()
    if (result.ok) setWebPushEnabled(true)
  }

  async function disablePush() {
    const result = await unsubscribeWebPush()
    if (result.ok) setWebPushEnabled(false)
  }

  if (loading) return <div className="p-8 text-sm text-muted-foreground">Loading notification settings...</div>

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center"><Bell className="w-5 h-5 text-primary" /></div>
        <div>
          <h1 className="text-2xl font-bold text-card-foreground">Notification controls</h1>
          <p className="text-sm text-muted-foreground">Tune reminders, updates, and channels your way.</p>
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-card p-5 space-y-4">
        <div className="grid md:grid-cols-2 gap-4">
          <label className="text-sm">Timezone
            <input value={timezone} onChange={(e) => setTimezone(e.target.value)} className="mt-1 w-full rounded-lg border border-border px-3 py-2 bg-background" />
          </label>
          <label className="text-sm">Frequency
            <select value={frequencyMode} onChange={(e) => setFrequencyMode(e.target.value as FrequencyMode)} className="mt-1 w-full rounded-lg border border-border px-3 py-2 bg-background">
              <option value="minimal">Minimal</option>
              <option value="balanced">Balanced</option>
              <option value="high">High</option>
            </select>
          </label>
          <label className="text-sm">Quiet start
            <input type="time" value={quietStart} onChange={(e) => setQuietStart(e.target.value)} className="mt-1 w-full rounded-lg border border-border px-3 py-2 bg-background" />
          </label>
          <label className="text-sm">Quiet end
            <input type="time" value={quietEnd} onChange={(e) => setQuietEnd(e.target.value)} className="mt-1 w-full rounded-lg border border-border px-3 py-2 bg-background" />
          </label>
        </div>
        <label className="text-sm flex items-center gap-2">
          <input type="checkbox" checked={dailyDigest} onChange={(e) => setDailyDigest(e.target.checked)} />
          Weekly digest email
        </label>
      </div>

      <div className="rounded-2xl border border-border bg-card p-5 space-y-4">
        <div className="flex items-center gap-2">
          <Volume2 className="w-4 h-4 text-primary" />
          <h2 className="font-semibold text-card-foreground">Sounds</h2>
        </div>
        <p className="text-xs text-muted-foreground">
          Subtle in-app chimes when Sudar or AI tasks finish. Respects quiet hours above. Off by default.
        </p>
        <label className="text-sm flex items-center gap-2">
          <input
            type="checkbox"
            checked={soundEnabled}
            onChange={(e) => updateSoundEnabled(e.target.checked)}
          />
          Enable notification sounds
        </label>
        <label className="text-sm block">
          Volume ({soundVolume}%)
          <input
            type="range"
            min={0}
            max={100}
            value={soundVolume}
            disabled={!soundEnabled}
            onChange={(e) => updateSoundVolume(Number(e.target.value))}
            className="mt-2 w-full disabled:opacity-50"
          />
        </label>
        <div className="space-y-3">
          {SOUND_GROUPS.map((group) => {
            const checked =
              group.id === 'task_complete'
                ? soundTaskComplete
                : group.id === 'sudar_reply'
                  ? soundSudarReply
                  : group.id === 'notification'
                    ? soundNotifications
                    : soundCelebration
            const setChecked =
              group.id === 'task_complete'
                ? setSoundTaskComplete
                : group.id === 'sudar_reply'
                  ? setSoundSudarReply
                  : group.id === 'notification'
                    ? setSoundNotifications
                    : setSoundCelebration
            const prefKey =
              group.id === 'task_complete'
                ? 'sound_task_complete'
                : group.id === 'sudar_reply'
                  ? 'sound_sudar_reply'
                  : group.id === 'notification'
                    ? 'sound_notifications'
                    : 'sound_celebration'
            return (
              <div key={group.id} className="flex items-start justify-between gap-3 border-t border-border/50 pt-3 first:border-0 first:pt-0">
                <label className="text-sm flex-1">
                  <span className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={checked}
                      disabled={!soundEnabled}
                      onChange={(e) => {
                        setChecked(e.target.checked)
                        setPrefsLocal({ [prefKey]: e.target.checked })
                      }}
                    />
                    {group.label}
                  </span>
                  <span className="block text-xs text-muted-foreground mt-1">{group.hint}</span>
                </label>
                <button
                  type="button"
                  disabled={!soundEnabled}
                  onClick={() => previewChime(group.id)}
                  className="shrink-0 px-2.5 py-1 rounded-lg border border-border text-xs disabled:opacity-50"
                >
                  Preview
                </button>
              </div>
            )
          })}
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-card p-5">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold text-card-foreground">Channels</h2>
          {webPushEnabled ? (
            <button onClick={() => void disablePush()} className="px-3 py-1.5 rounded-full border border-border text-sm">Disable web push</button>
          ) : (
            <button onClick={() => void enablePush()} className="px-3 py-1.5 rounded-full bg-primary text-primary-foreground text-sm">Enable web push (+10 coins)</button>
          )}
        </div>
        <p className="text-xs text-muted-foreground">Coin balance: {coinPreview.balance}. Opt-in bonus: {coinPreview.opt_in_bonus_awarded_at ? 'earned' : 'not earned'}.</p>
      </div>

      <div className="rounded-2xl border border-border bg-card p-5 overflow-auto">
        <h2 className="font-semibold text-card-foreground mb-3">Category x channel matrix</h2>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-muted-foreground border-b border-border">
              <th className="py-2">Category</th>
              {channels.map((channel) => <th key={channel} className="py-2">{channel}</th>)}
            </tr>
          </thead>
          <tbody>
            {categories.map((category) => (
              <tr key={category} className="border-b border-border/50">
                <td className="py-2">{category}</td>
                {channels.map((channel) => (
                  <td key={`${category}-${channel}`} className="py-2">
                    <input type="checkbox" checked={isEnabled(category, channel)} onChange={(e) => toggle(category, channel, e.target.checked)} />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="rounded-2xl border border-border bg-card p-5 text-sm text-muted-foreground">
        Last 30 days: {activity.sent} sent, {activity.opened} opened/clicked, {activity.suppressed} suppressed.
      </div>

      <button onClick={() => void save()} disabled={saving} className="px-4 py-2 rounded-xl bg-primary text-primary-foreground disabled:opacity-60">
        {saving ? 'Saving...' : 'Save notification settings'}
      </button>
    </div>
  )
}

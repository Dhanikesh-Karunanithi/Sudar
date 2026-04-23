'use client'

import { useEffect, useMemo, useState } from 'react'
import { Bell } from 'lucide-react'
import { registerServiceWorkerAndSubscribe, unsubscribeWebPush } from '@/lib/notifications/webPush'

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

export default function NotificationSettingsPage() {
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
        },
        preferences,
      }),
    })
    setSaving(false)
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

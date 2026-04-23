'use client'

import { useEffect, useMemo, useState } from 'react'
import { registerServiceWorkerAndSubscribe } from '@/lib/notifications/webPush'

const SNOOZE_DAYS = 14
const DENY_DAYS = 90

function getStoredDate(key: string): number | null {
  if (typeof window === 'undefined') return null
  const raw = window.localStorage.getItem(key)
  if (!raw) return null
  const parsed = Number(raw)
  return Number.isFinite(parsed) ? parsed : null
}

export function EnablePrimer() {
  const [visible, setVisible] = useState(false)
  const [busy, setBusy] = useState(false)
  const [emailDigest, setEmailDigest] = useState(true)
  const [missions, setMissions] = useState(true)
  const [coinDrops, setCoinDrops] = useState(true)
  const [tutorReplies, setTutorReplies] = useState(true)

  useEffect(() => {
    if (typeof window === 'undefined') return
    const never = window.localStorage.getItem('notif_primer_never') === '1'
    if (never) return
    const snoozeUntil = getStoredDate('notif_primer_snooze_until')
    if (snoozeUntil && Date.now() < snoozeUntil) return
    if (Notification.permission === 'denied') return
    const seen = window.localStorage.getItem('notif_primer_seen') === '1'
    if (!seen) setVisible(true)
  }, [])

  const selectedPrefs = useMemo(
    () => [
      { category_slug: 'mission_daily', channel: 'web_push', enabled: missions },
      { category_slug: 'coin_drop', channel: 'web_push', enabled: coinDrops },
      { category_slug: 'tutor_proactive', channel: 'web_push', enabled: tutorReplies },
      { category_slug: 'creator_campaign', channel: 'email', enabled: emailDigest },
    ],
    [missions, coinDrops, tutorReplies, emailDigest]
  )

  if (!visible) return null

  async function savePrefsAndEnable() {
    setBusy(true)
    try {
      await fetch('/api/learner/notification-settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ preferences: selectedPrefs, settings: { daily_digest_email: emailDigest } }),
      })
      const permission = await Notification.requestPermission()
      if (permission === 'granted') {
        await registerServiceWorkerAndSubscribe()
      } else if (permission === 'denied') {
        window.localStorage.setItem('notif_primer_snooze_until', String(Date.now() + DENY_DAYS * 86400000))
      }
      window.localStorage.setItem('notif_primer_seen', '1')
      setVisible(false)
    } finally {
      setBusy(false)
    }
  }

  function snooze() {
    window.localStorage.setItem('notif_primer_snooze_until', String(Date.now() + SNOOZE_DAYS * 86400000))
    setVisible(false)
  }

  async function never() {
    window.localStorage.setItem('notif_primer_never', '1')
    setVisible(false)
    await fetch('/api/learner/notification-settings', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ settings: { frequency_mode: 'minimal', never_prompt_push: true } }),
    })
  }

  return (
    <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 space-y-3">
      <p className="text-sm font-semibold text-card-foreground">Sudar will nudge you - not noise you.</p>
      <p className="text-xs text-muted-foreground">
        Enable gentle alerts for missions, coins, and tutor updates. Toggle off anytime. +10 Sudar Coins on first enable.
      </p>
      <div className="grid grid-cols-2 gap-2 text-xs">
        <label className="flex items-center gap-2"><input type="checkbox" checked={missions} onChange={(e) => setMissions(e.target.checked)} /> Missions & streaks</label>
        <label className="flex items-center gap-2"><input type="checkbox" checked={coinDrops} onChange={(e) => setCoinDrops(e.target.checked)} /> Coin drops</label>
        <label className="flex items-center gap-2"><input type="checkbox" checked={tutorReplies} onChange={(e) => setTutorReplies(e.target.checked)} /> Tutor replies</label>
        <label className="flex items-center gap-2"><input type="checkbox" checked={emailDigest} onChange={(e) => setEmailDigest(e.target.checked)} /> Weekly digest email</label>
      </div>
      <div className="flex items-center gap-2">
        <button disabled={busy} onClick={() => void savePrefsAndEnable()} className="px-3 py-1.5 rounded-full bg-primary text-primary-foreground text-xs font-semibold disabled:opacity-60">
          {busy ? 'Enabling...' : 'Enable alerts'}
        </button>
        <button onClick={snooze} className="text-xs text-muted-foreground hover:text-card-foreground">Not now</button>
        <button onClick={() => void never()} className="text-xs text-muted-foreground hover:text-card-foreground">Never</button>
      </div>
    </div>
  )
}

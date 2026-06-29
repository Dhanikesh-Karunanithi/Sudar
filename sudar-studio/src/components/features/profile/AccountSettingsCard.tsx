'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Save, User } from 'lucide-react'
import { SudarInlineLoader } from '@/components/branding/SudarBrandLoader'

export function AccountSettingsCard() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [fullName, setFullName] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    void (async () => {
      const res = await fetch('/api/profile')
      const json = (await res.json()) as {
        success?: boolean
        data?: { email: string; full_name: string | null }
        error?: string
      }
      if (!cancelled) {
        if (json.success && json.data) {
          setEmail(json.data.email)
          setFullName(json.data.full_name ?? '')
        } else {
          setError(json.error ?? 'Could not load profile')
        }
        setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  async function handleSave() {
    setSaving(true)
    setSaved(false)
    setError(null)
    const trimmed = fullName.trim()
    if (!trimmed) {
      setError('Please enter your name')
      setSaving(false)
      return
    }
    const res = await fetch('/api/profile', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ full_name: trimmed }),
    })
    const json = (await res.json()) as { success?: boolean; error?: string }
    setSaving(false)
    if (!res.ok || !json.success) {
      setError(json.error ?? 'Could not save profile')
      return
    }
    setSaved(true)
    router.refresh()
    setTimeout(() => setSaved(false), 2000)
  }

  if (loading) {
    return (
      <div className="rounded-2xl border border-border bg-card p-6 animate-pulse">
        <div className="h-5 w-40 rounded bg-muted" />
        <div className="mt-4 h-10 w-full rounded bg-muted" />
      </div>
    )
  }

  return (
    <div className="rounded-2xl border border-border bg-card p-6 space-y-4">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
          <User className="w-5 h-5 text-primary" aria-hidden />
        </div>
        <div>
          <h2 className="font-semibold text-card-foreground">Account</h2>
          <p className="text-muted-foreground text-sm mt-1">
            Your name appears across Sudar Studio and in team views.
          </p>
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <label htmlFor="account-email" className="block text-sm font-medium text-card-foreground mb-1.5">
            Email
          </label>
          <input
            id="account-email"
            type="email"
            value={email}
            readOnly
            className="w-full rounded-xl border border-border bg-muted/50 px-3 py-2 text-sm text-muted-foreground"
          />
        </div>
        <div>
          <label htmlFor="account-full-name" className="block text-sm font-medium text-card-foreground mb-1.5">
            Full name
          </label>
          <input
            id="account-full-name"
            type="text"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            maxLength={120}
            autoComplete="name"
            placeholder="Your name"
            className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-card-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-ring focus:border-transparent"
          />
        </div>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <button
        type="button"
        onClick={() => void handleSave()}
        disabled={saving}
        className="inline-flex items-center gap-2 rounded-xl bg-primary hover:bg-primary/90 disabled:opacity-50 text-primary-foreground px-4 py-2 text-sm font-medium"
      >
        {saving ? (
          <SudarInlineLoader size="sm" className="text-primary-foreground" starFill="var(--primary)" />
        ) : (
          <Save className="w-4 h-4" />
        )}
        {saved ? 'Saved' : 'Save account'}
      </button>
    </div>
  )
}

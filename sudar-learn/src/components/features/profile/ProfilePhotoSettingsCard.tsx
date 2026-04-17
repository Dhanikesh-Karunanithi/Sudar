'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Camera, Trash2 } from 'lucide-react'
import { UserAvatar } from '@/components/ui/UserAvatar'

export function ProfilePhotoSettingsCard() {
  const router = useRouter()
  const [profile, setProfile] = useState<{
    email: string
    full_name: string | null
    avatar_url: string | null
  } | null>(null)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    let cancelled = false
    void (async () => {
      const res = await fetch('/api/profile')
      const json = (await res.json()) as {
        success?: boolean
        data?: { email: string; full_name: string | null; avatar_url: string | null }
      }
      if (!cancelled && json.success && json.data) setProfile(json.data)
    })()
    return () => {
      cancelled = true
    }
  }, [])

  async function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    setBusy(true)
    const fd = new FormData()
    fd.set('file', file)
    const res = await fetch('/api/profile/avatar', { method: 'POST', body: fd })
    const json = (await res.json()) as { success?: boolean; data?: { avatar_url?: string | null } }
    setBusy(false)
    if (json.success && json.data?.avatar_url) {
      const next = json.data.avatar_url
      setProfile((p) => (p ? { ...p, avatar_url: next } : p))
      router.refresh()
    }
  }

  async function onRemove() {
    setBusy(true)
    const res = await fetch('/api/profile/avatar', { method: 'DELETE' })
    const json = (await res.json()) as { success?: boolean }
    setBusy(false)
    if (json.success) {
      setProfile((p) => (p ? { ...p, avatar_url: null } : p))
      router.refresh()
    }
  }

  if (!profile) {
    return (
      <div className="rounded-2xl border border-border bg-card p-6 animate-pulse">
        <div className="h-5 w-40 rounded bg-muted" />
        <div className="mt-4 h-24 w-24 rounded-full bg-muted" />
      </div>
    )
  }

  return (
    <div className="rounded-2xl border border-border bg-card p-6 space-y-3">
      <div>
        <h2 className="font-semibold text-card-foreground">Profile photo</h2>
        <p className="text-muted-foreground text-sm mt-1">
          Shown in the header, org leaderboard, and anywhere your name appears in Sudar Learn.
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-4">
        <UserAvatar
          email={profile.email}
          fullName={profile.full_name}
          avatarUrl={profile.avatar_url}
          size="lg"
        />
        <div className="flex flex-wrap gap-2">
          <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-border bg-muted px-4 py-2 text-sm font-medium text-card-foreground hover:bg-muted/80 disabled:opacity-50">
            <Camera className="h-4 w-4 shrink-0" />
            {busy ? 'Working…' : 'Upload photo'}
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              className="hidden"
              onChange={onFileChange}
              disabled={busy}
              aria-label="Upload profile photo"
            />
          </label>
          {profile.avatar_url && (
            <button
              type="button"
              onClick={() => void onRemove()}
              disabled={busy}
              className="inline-flex items-center gap-2 rounded-xl border border-border px-4 py-2 text-sm text-destructive hover:bg-destructive/10 disabled:opacity-50"
            >
              <Trash2 className="h-4 w-4 shrink-0" />
              Remove
            </button>
          )}
        </div>
      </div>
      <p className="text-xs text-muted-foreground">JPEG, PNG, WebP, or GIF · up to 2 MB</p>
    </div>
  )
}

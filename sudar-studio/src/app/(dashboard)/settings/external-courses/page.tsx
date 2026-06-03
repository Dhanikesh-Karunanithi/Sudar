'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Plus, Save } from 'lucide-react'
import { SudarInlineLoader } from '@/components/branding/SudarBrandLoader'
import { IMPORTABLE_PROVIDERS } from '@/lib/providers'

type Policy = {
  allow_external_courses?: boolean
  require_learner_consent?: boolean
  default_content_access_mode?: string
  default_allow_tutor_discussion?: boolean
  enabled_providers?: string[]
}

export default function ExternalCoursesSettingsPage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [policy, setPolicy] = useState<Policy>({})
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    const res = await fetch('/api/org/external-courses/settings')
    setLoading(false)
    if (!res.ok) {
      setError('Could not load settings')
      return
    }
    const data = await res.json()
    setPolicy(data.policy ?? {})
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  async function save() {
    setSaving(true)
    setError(null)
    setSaved(false)
    const res = await fetch('/api/org/external-courses/settings', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ policy }),
    })
    setSaving(false)
    if (!res.ok) {
      setError('Save failed')
      return
    }
    setSaved(true)
  }

  if (loading) {
    return (
      <div className="flex justify-center py-24">
        <SudarInlineLoader />
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      <Link href="/settings" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="w-4 h-4" />
        Settings
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">External courses</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Control how Sudar imports, displays, and recommends third-party courses.
          </p>
        </div>
        <Link
          href="/external-courses/import"
          className="inline-flex items-center gap-2 px-4 py-2 border border-border rounded-lg text-sm font-medium hover:bg-muted/50"
        >
          <Plus className="w-4 h-4" />
          Import course
        </Link>
      </div>

      <div className="rounded-xl border border-border p-5 space-y-4">
        <label className="flex items-center gap-3">
          <input
            type="checkbox"
            checked={policy.allow_external_courses !== false}
            onChange={(e) => setPolicy((p) => ({ ...p, allow_external_courses: e.target.checked }))}
          />
          <span className="text-sm">Allow external courses in catalog and NBA</span>
        </label>

        <label className="flex items-center gap-3">
          <input
            type="checkbox"
            checked={Boolean(policy.require_learner_consent)}
            onChange={(e) => setPolicy((p) => ({ ...p, require_learner_consent: e.target.checked }))}
          />
          <span className="text-sm">Require learner consent before opening external iframe</span>
        </label>

        <label className="flex items-center gap-3">
          <input
            type="checkbox"
            checked={policy.default_allow_tutor_discussion !== false}
            onChange={(e) => setPolicy((p) => ({ ...p, default_allow_tutor_discussion: e.target.checked }))}
          />
          <span className="text-sm">Allow Sudar tutor to discuss imported course topics by default</span>
        </label>

        <label className="block space-y-1">
          <span className="text-sm font-medium">Default access mode</span>
          <select
            value={policy.default_content_access_mode ?? 'both'}
            onChange={(e) => setPolicy((p) => ({ ...p, default_content_access_mode: e.target.value }))}
            className="w-full rounded-lg border border-border px-3 py-2 text-sm"
          >
            <option value="both">Iframe + tutor</option>
            <option value="tutor_access">Tutor metadata only</option>
            <option value="iframe_only">Iframe only</option>
          </select>
        </label>

        <div className="space-y-2">
          <p className="text-sm font-medium">Enabled providers</p>
          <div className="flex flex-wrap gap-2">
            {IMPORTABLE_PROVIDERS.map((p) => {
              const enabled = (policy.enabled_providers ?? IMPORTABLE_PROVIDERS.map((x) => x.slug)).includes(p.slug)
              return (
                <button
                  key={p.slug}
                  type="button"
                  onClick={() => {
                    const current = policy.enabled_providers ?? IMPORTABLE_PROVIDERS.map((x) => x.slug)
                    const next = enabled ? current.filter((s) => s !== p.slug) : [...current, p.slug]
                    setPolicy((pol) => ({ ...pol, enabled_providers: next }))
                  }}
                  className={`px-3 py-1 rounded-full text-xs border ${
                    enabled ? 'bg-primary/10 border-primary text-primary' : 'border-border'
                  }`}
                >
                  {p.label}
                </button>
              )
            })}
          </div>
        </div>
      </div>

      <p className="text-xs text-muted-foreground">
        Provider API keys: set <code className="text-xs">UDEMY_CLIENT_ID</code>,{' '}
        <code className="text-xs">UDEMY_CLIENT_SECRET</code>, and{' '}
        <code className="text-xs">YOUTUBE_API_KEY</code> in Studio env for richer search. edX public API works without keys.
      </p>

      {error && <p className="text-sm text-destructive">{error}</p>}
      {saved && <p className="text-sm text-success">Settings saved.</p>}

      <button
        type="button"
        onClick={() => void save()}
        disabled={saving}
        className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground rounded-lg font-medium disabled:opacity-60"
      >
        {saving ? <SudarInlineLoader size="sm" /> : <Save className="w-4 h-4" />}
        Save policy
      </button>
    </div>
  )
}

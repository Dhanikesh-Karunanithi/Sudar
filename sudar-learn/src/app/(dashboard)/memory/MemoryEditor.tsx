'use client'

import { useEffect, useState } from 'react'
import { Save, CheckCircle2 } from 'lucide-react'
import { SudarInlineLoader } from '@/components/branding/SudarBrandLoader'
import {
  clearUserLocalTutorCache,
  getCachedConversation,
  isLocalTutorCacheEnabled,
  putMemorySnapshot,
  setLocalTutorCacheEnabled,
} from '@/lib/cache/localTutorCache'

interface Props {
  userId: string
  initialBackground: string
  initialGoals: string
  initialPreference: string
}

export function MemoryEditor({ userId, initialBackground, initialGoals, initialPreference }: Props) {
  const [background, setBackground] = useState(initialBackground)
  const [goals, setGoals] = useState(initialGoals)
  const [preference, setPreference] = useState(initialPreference)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [cacheEnabled, setCacheEnabled] = useState(isLocalTutorCacheEnabled())
  const [cacheNotice, setCacheNotice] = useState<string>('Local cache ready')

  useEffect(() => {
    if (!cacheEnabled) return
    void putMemorySnapshot({
      userId,
      selfReportedBackground: initialBackground,
      learningGoals: initialGoals,
      preferredExplanationStyle: initialPreference,
    }).catch(() => {})
  }, [cacheEnabled, initialBackground, initialGoals, initialPreference, userId])

  async function handleSave() {
    setSaving(true); setSaved(false); setError(null)
    const res = await fetch('/api/tutor/memory', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ self_reported_background: background, learning_goals: goals, preferred_explanation_style: preference }),
    })
    if (!res.ok) {
      const d = await res.json()
      setError(d.error ?? 'Failed to save')
    } else {
      void putMemorySnapshot({
        userId,
        selfReportedBackground: background,
        learningGoals: goals,
        preferredExplanationStyle: preference,
      }).catch(() => {})
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    }
    setSaving(false)
  }

  async function handleExport(kind: 'json' | 'md') {
    setCacheNotice('Preparing export...')
    const messages = (await getCachedConversation(userId, 'floating')) ?? []
    const payload = {
      exported_at: new Date().toISOString(),
      memory: {
        self_reported_background: background,
        learning_goals: goals,
        preferred_explanation_style: preference,
      },
      transcript: messages,
    }
    const content =
      kind === 'json'
        ? JSON.stringify(payload, null, 2)
        : [
            '# Sudar Memory Export',
            '',
            `Exported at: ${payload.exported_at}`,
            '',
            '## Your context',
            `- Background: ${background || 'Not provided'}`,
            `- Goals: ${goals || 'Not provided'}`,
            `- Preferred style: ${preference || 'Not provided'}`,
            '',
            '## Transcript',
            ...(messages.length > 0
              ? messages.map((m) => `- **${m.role}**: ${m.content}`)
              : ['- No cached transcript available.']),
          ].join('\n')
    const file = new Blob([content], { type: kind === 'json' ? 'application/json' : 'text/markdown' })
    const url = URL.createObjectURL(file)
    const a = document.createElement('a')
    a.href = url
    a.download = `sudar-memory-export.${kind}`
    a.click()
    URL.revokeObjectURL(url)
    setCacheNotice('Export complete')
  }

  async function handleClearLocalCache() {
    await clearUserLocalTutorCache(userId, 'floating')
    setCacheNotice('Local cache cleared. Cloud data is unchanged.')
  }

  function handleToggleCache(enabled: boolean) {
    setLocalTutorCacheEnabled(enabled)
    setCacheEnabled(enabled)
    setCacheNotice(enabled ? 'Synced with Sudar' : 'Local cache paused')
  }

  return (
    <div className="bg-card border border-border rounded-card-lg p-5 space-y-5">
      <div className="space-y-1.5">
        <label className="text-sm font-medium text-card-foreground">Your background</label>
        <p className="text-xs text-muted-foreground">What&apos;s your experience level? What do you already know?</p>
        <textarea
          value={background}
          onChange={(e) => setBackground(e.target.value)}
          rows={2}
          placeholder="e.g. I'm a software developer with 3 years of experience in web development, but new to cybersecurity."
          className="w-full px-3 py-2 border border-border rounded-button text-sm bg-muted text-foreground placeholder:text-muted-foreground caret-primary focus:outline-none focus:border-primary resize-none"
        />
      </div>

      <div className="space-y-1.5">
        <label className="text-sm font-medium text-card-foreground">Learning goals</label>
        <p className="text-xs text-muted-foreground">What are you trying to achieve with this learning?</p>
        <textarea
          value={goals}
          onChange={(e) => setGoals(e.target.value)}
          rows={2}
          placeholder="e.g. I want to pass the CompTIA Security+ exam within 3 months."
          className="w-full px-3 py-2 border border-border rounded-button text-sm bg-muted text-foreground placeholder:text-muted-foreground caret-primary focus:outline-none focus:border-primary resize-none"
        />
      </div>

      <div className="space-y-1.5">
        <label className="text-sm font-medium text-card-foreground">How you learn best</label>
        <p className="text-xs text-muted-foreground">Sudar will tailor explanations to your preference.</p>
        <div className="grid grid-cols-2 gap-2">
          {[
            { value: 'examples-first', label: 'Examples first', desc: 'Show me an example, then explain' },
            { value: 'theory-first', label: 'Theory first', desc: 'Explain the concept, then show examples' },
            { value: 'analogies', label: 'Analogies', desc: 'Use real-world comparisons' },
            { value: 'step-by-step', label: 'Step-by-step', desc: 'Break everything into small steps' },
          ].map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setPreference(opt.value)}
              className={`text-left p-3 rounded-button border text-xs transition-all ${
                preference === opt.value
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'border-border text-muted-foreground hover:border-primary/30'
              }`}
            >
              <p className="font-medium">{opt.label}</p>
              <p className="text-muted-foreground mt-0.5">{opt.desc}</p>
            </button>
          ))}
        </div>
      </div>

      {error && <p className="text-destructive text-xs">{error}</p>}

      <button
        onClick={handleSave}
        disabled={saving}
        className="flex items-center gap-2 px-4 py-2 bg-primary hover:opacity-90 disabled:bg-muted text-primary-foreground disabled:text-muted-foreground text-sm font-medium rounded-button transition-all"
      >
        {saving ? <SudarInlineLoader size="sm" /> : saved ? <CheckCircle2 className="w-4 h-4" /> : <Save className="w-4 h-4" />}
        {saved ? 'Saved!' : 'Save context'}
      </button>
      <div className="space-y-3 rounded-button border border-border bg-muted/30 p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-sm font-medium text-card-foreground">Faster reload (local cache)</p>
            <p className="text-xs text-muted-foreground mt-1">
              Keeps a local browser copy of your memory and recent Sudar chat for quicker loading. Clearing site data removes this local copy, but your Sudar account remains the source of truth.
            </p>
          </div>
          <button
            type="button"
            onClick={() => handleToggleCache(!cacheEnabled)}
            className={`rounded-pill px-3 py-1.5 text-xs font-medium transition-colors ${
              cacheEnabled ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground border border-border'
            }`}
          >
            {cacheEnabled ? 'On' : 'Off'}
          </button>
        </div>
        <p className="text-[11px] text-muted-foreground">{cacheNotice}</p>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => handleExport('json')}
            className="px-3 py-1.5 rounded-button border border-border text-xs text-card-foreground hover:bg-muted"
          >
            Export JSON
          </button>
          <button
            type="button"
            onClick={() => handleExport('md')}
            className="px-3 py-1.5 rounded-button border border-border text-xs text-card-foreground hover:bg-muted"
          >
            Export Markdown
          </button>
          <button
            type="button"
            onClick={handleClearLocalCache}
            className="px-3 py-1.5 rounded-button border border-border text-xs text-destructive hover:bg-destructive/5"
          >
            Clear local cache only
          </button>
        </div>
      </div>
    </div>
  )
}

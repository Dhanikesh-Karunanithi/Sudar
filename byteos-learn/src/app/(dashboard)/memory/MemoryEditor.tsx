'use client'

import { useState } from 'react'
import { Save, CheckCircle2, Loader2 } from 'lucide-react'

interface Props {
  userId: string
  initialBackground: string
  initialGoals: string
  initialPreference: string
}

export function MemoryEditor({ initialBackground, initialGoals, initialPreference }: Props) {
  const [background, setBackground] = useState(initialBackground)
  const [goals, setGoals] = useState(initialGoals)
  const [preference, setPreference] = useState(initialPreference)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)

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
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    }
    setSaving(false)
  }

  return (
    <div className="bg-card border border-border rounded-card-lg p-5 space-y-5">
      <div className="space-y-1.5">
        <label className="text-sm font-medium text-card-foreground">Your background</label>
        <p className="text-xs text-muted-foreground">What's your experience level? What do you already know?</p>
        <textarea
          value={background}
          onChange={(e) => setBackground(e.target.value)}
          rows={2}
          placeholder="e.g. I'm a software developer with 3 years of experience in web development, but new to cybersecurity."
          className="w-full px-3 py-2 border border-border rounded-button text-sm text-card-foreground placeholder-muted-foreground focus:outline-none focus:border-primary resize-none"
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
          className="w-full px-3 py-2 border border-border rounded-button text-sm text-card-foreground placeholder-muted-foreground focus:outline-none focus:border-primary resize-none"
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
        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : saved ? <CheckCircle2 className="w-4 h-4" /> : <Save className="w-4 h-4" />}
        {saved ? 'Saved!' : 'Save context'}
      </button>
    </div>
  )
}

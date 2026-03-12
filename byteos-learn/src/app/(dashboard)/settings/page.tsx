'use client'

import { useState, useEffect, useCallback } from 'react'
import { Settings, Loader2, Volume2, Save } from 'lucide-react'
import { ModelPicker, type ModelPickerOption } from '@/components/ui/ModelPicker'

const TTS_VOICE_OPTIONS: ModelPickerOption[] = [
  { id: 'en-US-JennyNeural', name: 'Jenny (US)', description: 'Natural US English, female' },
  { id: 'en-US-GuyNeural', name: 'Guy (US)', description: 'Natural US English, male' },
  { id: 'en-GB-SoniaNeural', name: 'Sonia (UK)', description: 'Natural British English, female' },
  { id: 'en-GB-RyanNeural', name: 'Ryan (UK)', description: 'Natural British English, male' },
  { id: 'sarvam_shreya', name: 'Shreya (Sarvam)', description: 'Indian English, expressive (Sarvam AI)' },
  { id: 'sarvam_shubh', name: 'Shubh (Sarvam)', description: 'Indian English, conversational (Sarvam AI)' },
]

export default function SettingsPage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [ttsVoice, setTtsVoice] = useState<string | null>('en-US-JennyNeural')

  const fetchPreferences = useCallback(async () => {
    const res = await fetch('/api/learner/preferences')
    if (!res.ok) {
      setLoading(false)
      return
    }
    const data = await res.json()
    setTtsVoice(data.tts_voice ?? 'en-US-JennyNeural')
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchPreferences()
  }, [fetchPreferences])

  async function handleSave() {
    setSaving(true)
    setSaved(false)
    const res = await fetch('/api/learner/preferences', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tts_voice: ttsVoice }),
    })
    setSaving(false)
    if (res.ok) {
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    }
  }

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[200px]">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    )
  }

  return (
    <div className="p-8 max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
            <Settings className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-card-foreground">Preferences</h1>
            <p className="text-muted-foreground text-sm">
              Choose how you like to learn
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary hover:bg-primary/90 disabled:opacity-50 text-primary-foreground text-sm font-medium transition-colors"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {saved ? 'Saved' : 'Save'}
        </button>
      </div>

      <div className="rounded-2xl border border-border bg-card p-6 space-y-6">
        <h2 className="font-semibold text-card-foreground">Audio (Listen)</h2>
        <p className="text-muted-foreground text-sm">
          Your preferred voice when listening to course content in the Listen modality.
        </p>
        <ModelPicker
          title="TTS voice"
          subtitle="Select the voice you prefer for audiobook-style course audio."
          options={TTS_VOICE_OPTIONS.map((o) => ({ ...o, icon: <Volume2 className="w-4 h-4" /> }))}
          value={ttsVoice}
          onChange={(id) => setTtsVoice(id)}
        />
      </div>
    </div>
  )
}

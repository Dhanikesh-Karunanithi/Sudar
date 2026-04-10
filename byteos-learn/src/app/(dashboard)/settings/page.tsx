'use client'

import { useState, useEffect, useCallback } from 'react'
import { Settings, Volume2, Save } from 'lucide-react'
import { SudarInlineLoader, SudarLoadingFrost } from '@/components/branding/SudarBrandLoader'
import { ModelPicker, type ModelPickerOption } from '@/components/ui/ModelPicker'
import { trackMascotEvent } from '@/lib/mascot/tracking'
import type { MascotId, MascotIntensity, MascotMode, MascotSupportStyle } from '@/types/mascot'

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
  const [mascotMode, setMascotMode] = useState<MascotMode>('all')
  const [mascotStyle, setMascotStyle] = useState<MascotSupportStyle>('balanced')
  const [mascotIntensity, setMascotIntensity] = useState<MascotIntensity>('high')
  const [mascotCompanions, setMascotCompanions] = useState<MascotId[]>(['focus', 'memory', 'confidence'])

  const fetchPreferences = useCallback(async () => {
    const res = await fetch('/api/learner/preferences')
    if (!res.ok) {
      setLoading(false)
      return
    }
    const data = await res.json()
    setTtsVoice(data.tts_voice ?? 'en-US-JennyNeural')
    setMascotMode(data.mascot_mode ?? 'all')
    setMascotStyle(data.mascot_style ?? 'balanced')
    setMascotIntensity(data.mascot_intensity ?? 'high')
    setMascotCompanions(Array.isArray(data.mascot_companions) ? data.mascot_companions : ['focus', 'memory', 'confidence'])
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
      body: JSON.stringify({
        tts_voice: ttsVoice,
        mascot_mode: mascotMode,
        mascot_style: mascotStyle,
        mascot_intensity: mascotIntensity,
        mascot_companions: mascotCompanions,
      }),
    })
    setSaving(false)
    if (res.ok) {
      void trackMascotEvent({
        eventType: 'mascot_mode_change',
        mascotId: 'sudar',
        source: 'settings',
        detail: {
          mascot_mode: mascotMode,
          mascot_style: mascotStyle,
          mascot_intensity: mascotIntensity,
          mascot_companions: mascotCompanions,
        },
      })
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    }
  }

  function toggleCompanion(id: MascotId) {
    if (id === 'sudar') return
    setMascotCompanions((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id])
  }

  if (loading) {
    return (
      <div className="relative p-8 min-h-[min(50vh,420px)] overflow-hidden rounded-2xl">
        <SudarLoadingFrost label="Loading preferences…" className="rounded-2xl" />
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
          {saving ? (
            <SudarInlineLoader size="sm" className="text-primary-foreground" starFill="var(--primary)" />
          ) : (
            <Save className="w-4 h-4" />
          )}
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

      <div className="rounded-2xl border border-border bg-card p-6 space-y-6">
        <h2 className="font-semibold text-card-foreground">Sudar companions</h2>
        <p className="text-muted-foreground text-sm">
          Choose how Sudar and companions support your learning journey.
        </p>

        <div className="space-y-2">
          <p className="text-sm font-medium text-card-foreground">Visibility mode</p>
          <div className="flex flex-wrap gap-2">
            {(['all', 'selected', 'hero-only'] as MascotMode[]).map((mode) => (
              <button
                key={mode}
                type="button"
                onClick={() => setMascotMode(mode)}
                className={`px-3 py-1.5 rounded-full border text-xs font-semibold transition-colors ${
                  mascotMode === mode ? 'border-primary bg-primary/10 text-primary' : 'border-border text-muted-foreground hover:text-card-foreground'
                }`}
              >
                {mode}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <p className="text-sm font-medium text-card-foreground">Support style</p>
          <div className="flex flex-wrap gap-2">
            {(['calm', 'balanced', 'energetic'] as MascotSupportStyle[]).map((style) => (
              <button
                key={style}
                type="button"
                onClick={() => setMascotStyle(style)}
                className={`px-3 py-1.5 rounded-full border text-xs font-semibold transition-colors ${
                  mascotStyle === style ? 'border-primary bg-primary/10 text-primary' : 'border-border text-muted-foreground hover:text-card-foreground'
                }`}
              >
                {style}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <p className="text-sm font-medium text-card-foreground">Interaction intensity</p>
          <div className="flex flex-wrap gap-2">
            {(['low', 'medium', 'high'] as MascotIntensity[]).map((intensity) => (
              <button
                key={intensity}
                type="button"
                onClick={() => setMascotIntensity(intensity)}
                className={`px-3 py-1.5 rounded-full border text-xs font-semibold transition-colors ${
                  mascotIntensity === intensity ? 'border-primary bg-primary/10 text-primary' : 'border-border text-muted-foreground hover:text-card-foreground'
                }`}
              >
                {intensity}
              </button>
            ))}
          </div>
        </div>

        {mascotMode !== 'hero-only' && (
          <div className="space-y-2">
            <p className="text-sm font-medium text-card-foreground">Companions</p>
            <div className="flex flex-wrap gap-2">
              {(['focus', 'memory', 'confidence'] as MascotId[]).map((id) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => toggleCompanion(id)}
                  className={`px-3 py-1.5 rounded-full border text-xs font-semibold transition-colors ${
                    mascotCompanions.includes(id) ? 'border-primary bg-primary/10 text-primary' : 'border-border text-muted-foreground hover:text-card-foreground'
                  }`}
                >
                  {id}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

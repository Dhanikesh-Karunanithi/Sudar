'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import {
  Settings,
  Building2,
  BarChart2,
  Loader2,
  Plus,
  Trash2,
  Save,
  Volume2,
  Sparkles,
} from 'lucide-react'
import type { PerformanceConfig, KpiDefinition, TermDefinition } from '@/types/performance'
import { ModelPicker, type ModelPickerOption } from '@/components/ui/ModelPicker'

const TTS_VOICE_OPTIONS: ModelPickerOption[] = [
  { id: 'en-US-JennyNeural', name: 'Jenny (US)', description: 'Natural US English, female' },
  { id: 'en-US-GuyNeural', name: 'Guy (US)', description: 'Natural US English, male' },
  { id: 'en-GB-SoniaNeural', name: 'Sonia (UK)', description: 'Natural British English, female' },
  { id: 'en-GB-RyanNeural', name: 'Ryan (UK)', description: 'Natural British English, male' },
  { id: 'sarvam_shreya', name: 'Shreya (Sarvam)', description: 'Indian English, expressive (Sarvam AI)' },
  { id: 'sarvam_shubh', name: 'Shubh (Sarvam)', description: 'Indian English, conversational (Sarvam AI)' },
]

const CONTENT_GENERATION_MODEL_OPTIONS: ModelPickerOption[] = [
  { id: 'default', name: 'Default', description: 'Great for most course generation tasks' },
  { id: 'complex', name: 'Complex tasks', description: 'Better for long or detailed content' },
  { id: 'fast', name: 'Faster', description: 'Quicker responses for daily use' },
]

export default function SettingsPage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [forbidden, setForbidden] = useState(false)
  const [saved, setSaved] = useState(false)
  const [institutionType, setInstitutionType] = useState<PerformanceConfig['institution_type']>('other')
  const [kpis, setKpis] = useState<KpiDefinition[]>([])
  const [scale, setScale] = useState<'percentage' | 'letter' | 'gpa'>('percentage')
  const [terms, setTerms] = useState<TermDefinition[]>([])
  const [ttsVoice, setTtsVoice] = useState<string | null>('en-US-JennyNeural')
  const [contentGenerationModel, setContentGenerationModel] = useState<string | null>('default')

  const fetchSettings = useCallback(async () => {
    const res = await fetch('/api/org/settings')
    if (res.status === 403) {
      setForbidden(true)
      setLoading(false)
      return
    }
    if (!res.ok) {
      setLoading(false)
      return
    }
    const data = await res.json()
    setInstitutionType(data.institution_type ?? 'other')
    setKpis(Array.isArray(data.kpis) ? data.kpis : [])
    setScale(data.scale ?? 'percentage')
    setTerms(Array.isArray(data.terms) ? data.terms : [])
    if (data.ai_models) {
      setTtsVoice(data.ai_models.tts_voice ?? 'en-US-JennyNeural')
      setContentGenerationModel(data.ai_models.content_generation_model ?? 'default')
    }
    setLoading(false)
  }, [])

  useEffect(() => { fetchSettings() }, [fetchSettings])

  async function handleSave() {
    setSaving(true)
    setSaved(false)
    const performance_config: PerformanceConfig = {
      institution_type: institutionType,
      ...(institutionType === 'corporate' && { kpis }),
      ...(institutionType === 'educational' && { scale, terms }),
    }
    const res = await fetch('/api/org/settings', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        performance_config,
        ai_models: {
          tts_voice: ttsVoice,
          content_generation_model: contentGenerationModel,
        },
      }),
    })
    setSaving(false)
    if (res.ok) {
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    }
  }

  function addKpi() {
    setKpis((prev) => [
      ...prev,
      { id: `kpi-${Date.now()}`, name: '', unit: '', period: 'monthly' },
    ])
  }

  function removeKpi(id: string) {
    setKpis((prev) => prev.filter((k) => k.id !== id))
  }

  function updateKpi(id: string, field: keyof KpiDefinition, value: string | number) {
    setKpis((prev) =>
      prev.map((k) => (k.id === id ? { ...k, [field]: value } : k))
    )
  }

  function addTerm() {
    const now = new Date()
    const start = now.toISOString().slice(0, 10)
    const end = new Date(now.setMonth(now.getMonth() + 3)).toISOString().slice(0, 10)
    setTerms((prev) => [
      ...prev,
      { id: `term-${Date.now()}`, name: '', start, end },
    ])
  }

  function removeTerm(id: string) {
    setTerms((prev) => prev.filter((t) => t.id !== id))
  }

  function updateTerm(id: string, field: keyof TermDefinition, value: string) {
    setTerms((prev) =>
      prev.map((t) => (t.id === id ? { ...t, [field]: value } : t))
    )
  }

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[200px]">
        <Loader2 className="w-8 h-8 text-indigo-400 animate-spin" />
      </div>
    )
  }

  if (forbidden) {
    return (
      <div className="p-8 max-w-xl mx-auto">
        <div className="rounded-xl bg-amber-500/10 border border-amber-500/30 p-4 flex items-center gap-3">
          <Settings className="w-6 h-6 text-amber-500 shrink-0" />
          <div>
            <p className="font-medium text-white">Access restricted</p>
            <p className="text-sm text-slate-400 mt-0.5">
              You need an Admin or Manager role to change organization settings.
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-8 max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center">
            <Settings className="w-6 h-6 text-indigo-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Org settings</h1>
            <p className="text-slate-400 text-sm">
              Institution type and performance configuration
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-sm font-medium"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {saved ? 'Saved' : 'Save'}
        </button>
      </div>

      <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-6 space-y-4">
        <div className="flex items-center gap-2">
          <Building2 className="w-4 h-4 text-slate-500" />
          <h2 className="font-semibold text-white">Institution type</h2>
        </div>
        <p className="text-slate-500 text-sm">
          This drives how performance data (KPIs or grades) is configured for learners.
        </p>
        <select
          value={institutionType}
          onChange={(e) => setInstitutionType(e.target.value as PerformanceConfig['institution_type'])}
          className="w-full max-w-xs rounded-lg border border-slate-700 bg-slate-800 text-white px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
        >
          <option value="corporate">Corporate</option>
          <option value="educational">Educational</option>
          <option value="other">Other</option>
        </select>
      </div>

      {institutionType === 'corporate' && (
        <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BarChart2 className="w-4 h-4 text-slate-500" />
              <h2 className="font-semibold text-white">KPIs</h2>
            </div>
            <button
              type="button"
              onClick={addKpi}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-200 text-sm font-medium"
            >
              <Plus className="w-4 h-4" />
              Add KPI
            </button>
          </div>
          <p className="text-slate-500 text-sm">
            Define the performance metrics you track for learners (e.g. Sales target, NPS).
          </p>
          <div className="space-y-3">
            {kpis.map((k) => (
              <div
                key={k.id}
                className="flex flex-wrap items-center gap-2 rounded-lg border border-slate-700 bg-slate-800/50 p-3"
              >
                <input
                  type="text"
                  placeholder="Name"
                  value={k.name}
                  onChange={(e) => updateKpi(k.id, 'name', e.target.value)}
                  className="flex-1 min-w-[120px] rounded border border-slate-600 bg-slate-800 px-2 py-1.5 text-sm text-white placeholder-slate-500"
                />
                <input
                  type="text"
                  placeholder="Unit (e.g. %)"
                  value={k.unit ?? ''}
                  onChange={(e) => updateKpi(k.id, 'unit', e.target.value)}
                  className="w-20 rounded border border-slate-600 bg-slate-800 px-2 py-1.5 text-sm text-white placeholder-slate-500"
                />
                <input
                  type="text"
                  placeholder="Period"
                  value={k.period ?? ''}
                  onChange={(e) => updateKpi(k.id, 'period', e.target.value)}
                  className="w-24 rounded border border-slate-600 bg-slate-800 px-2 py-1.5 text-sm text-white placeholder-slate-500"
                />
                <button
                  type="button"
                  onClick={() => removeKpi(k.id)}
                  className="p-1.5 rounded text-slate-400 hover:text-red-400 hover:bg-slate-700"
                  title="Remove"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
            {kpis.length === 0 && (
              <p className="text-slate-500 text-sm italic">No KPIs defined. Add one above.</p>
            )}
          </div>
        </div>
      )}

      {institutionType === 'educational' && (
        <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-6 space-y-4">
          <div className="flex items-center gap-2">
            <BarChart2 className="w-4 h-4 text-slate-500" />
            <h2 className="font-semibold text-white">Grade scale</h2>
          </div>
          <select
            value={scale}
            onChange={(e) => setScale(e.target.value as 'percentage' | 'letter' | 'gpa')}
            className="rounded-lg border border-slate-700 bg-slate-800 text-white px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500"
          >
            <option value="percentage">Percentage</option>
            <option value="letter">Letter (A–F)</option>
            <option value="gpa">GPA</option>
          </select>
          <div className="flex items-center justify-between pt-2">
            <h3 className="font-medium text-slate-300 text-sm">Terms / periods</h3>
            <button
              type="button"
              onClick={addTerm}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-200 text-sm font-medium"
            >
              <Plus className="w-4 h-4" />
              Add term
            </button>
          </div>
          <div className="space-y-3">
            {terms.map((t) => (
              <div
                key={t.id}
                className="flex flex-wrap items-center gap-2 rounded-lg border border-slate-700 bg-slate-800/50 p-3"
              >
                <input
                  type="text"
                  placeholder="Term name"
                  value={t.name}
                  onChange={(e) => updateTerm(t.id, 'name', e.target.value)}
                  className="flex-1 min-w-[120px] rounded border border-slate-600 bg-slate-800 px-2 py-1.5 text-sm text-white placeholder-slate-500"
                />
                <input
                  type="date"
                  value={t.start}
                  onChange={(e) => updateTerm(t.id, 'start', e.target.value)}
                  className="rounded border border-slate-600 bg-slate-800 px-2 py-1.5 text-sm text-white"
                />
                <input
                  type="date"
                  value={t.end}
                  onChange={(e) => updateTerm(t.id, 'end', e.target.value)}
                  className="rounded border border-slate-600 bg-slate-800 px-2 py-1.5 text-sm text-white"
                />
                <button
                  type="button"
                  onClick={() => removeTerm(t.id)}
                  className="p-1.5 rounded text-slate-400 hover:text-red-400 hover:bg-slate-700"
                  title="Remove"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {institutionType === 'other' && (
        <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-6">
          <p className="text-slate-500 text-sm">
            Use “Other” for custom or flexible performance tracking. You can still add performance records with custom keys from the user detail page.
          </p>
        </div>
      )}

      <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-6 space-y-6">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-slate-500" />
          <h2 className="font-semibold text-white">AI models</h2>
        </div>
        <p className="text-slate-500 text-sm">
          Default models for course generation and Listen (audio) modality. Learners can override TTS voice in Learn.
        </p>
        <p className="text-slate-500 text-xs">
          To configure API keys for AI providers (OpenRouter, Together, OpenAI, etc.), go to{' '}
          <Link href="/settings/keys" className="text-indigo-400 hover:text-indigo-300">AI &amp; API Keys</Link>.
        </p>
        <div className="space-y-6">
          <ModelPicker
            title="TTS voice"
            subtitle="Default voice for Listen (audiobook-style) audio. Used when generating module audio."
            options={TTS_VOICE_OPTIONS.map((o) => ({ ...o, icon: <Volume2 className="w-4 h-4" /> }))}
            value={ttsVoice}
            onChange={(id) => setTtsVoice(id)}
            className="text-white"
          />
          <ModelPicker
            title="Content generation"
            subtitle="Default model for AI course and content generation in Studio."
            options={CONTENT_GENERATION_MODEL_OPTIONS.map((o) => ({ ...o, icon: <Sparkles className="w-4 h-4" /> }))}
            value={contentGenerationModel}
            onChange={(id) => setContentGenerationModel(id)}
            className="text-white"
          />
        </div>
      </div>
    </div>
  )
}

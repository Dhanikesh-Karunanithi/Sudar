'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { CrmOverlayEditor } from './CrmOverlayEditor'
import { defaultScenarioDraft, SIM_LOCALES, type SimCrmSkin, type SimScenario } from '@/types/sudarsim'

export function SimScenarioEditor({
  scenarioId,
  initialScenario,
  initialCrmSkin,
  backHref = '/sudarsim',
  onSaved,
}: {
  scenarioId: string
  initialScenario?: Partial<SimScenario> | null
  initialCrmSkin?: SimCrmSkin | null
  backHref?: string
  onSaved?: () => void
}) {
  const [scenario, setScenario] = useState<Partial<SimScenario>>(
    initialScenario ?? defaultScenarioDraft(),
  )
  const [crmSkin, setCrmSkin] = useState<SimCrmSkin | null>(initialCrmSkin ?? null)
  const [transcript, setTranscript] = useState('')
  const [sopText, setSopText] = useState('')
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  const save = async (publish = false) => {
    setSaving(true)
    setMessage(null)
    const res = await fetch(`/api/sudarsim/scenarios/${scenarioId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        scenario: { ...scenario, status: publish ? 'published' : 'draft' },
        crm_skin: crmSkin,
        publish,
      }),
    })
    const data = await res.json()
    setSaving(false)
    if (!data.success) {
      setMessage(data.error ?? 'Save failed')
      return
    }
    setMessage(publish ? 'Published' : 'Saved draft')
    onSaved?.()
  }

  const importFromTranscript = async () => {
    if (transcript.length < 50) return
    setSaving(true)
    const res = await fetch('/api/ai/sim/from-transcript', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ transcript, locale: scenario.locale ?? 'en' }),
    })
    const data = await res.json()
    setSaving(false)
    if (data.scenario) setScenario((s) => ({ ...s, ...data.scenario }))
  }

  const importFromSop = async () => {
    if (sopText.length < 20) return
    setSaving(true)
    const res = await fetch('/api/ai/sim/generate-scenario', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: sopText, locale: scenario.locale ?? 'en' }),
    })
    const data = await res.json()
    setSaving(false)
    if (data.scenario) setScenario((s) => ({ ...s, ...data.scenario }))
  }

  return (
    <div className="mx-auto max-w-5xl space-y-8 p-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-1">
          <Link
            href={backHref}
            className="inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-slate-200"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden />
            Back to SudarSim library
          </Link>
          <h1 className="text-2xl font-bold text-white">SudarSim scenario</h1>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            disabled={saving}
            onClick={() => save(false)}
            className="rounded-lg border border-slate-600 px-4 py-2 text-sm text-slate-200"
          >
            Save draft
          </button>
          <button
            type="button"
            disabled={saving}
            onClick={() => save(true)}
            className="rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white"
          >
            Publish
          </button>
        </div>
      </div>
      {message ? <p className="text-sm text-emerald-400">{message}</p> : null}

      <section className="space-y-3 rounded-xl border border-slate-700 bg-slate-900/40 p-4">
        <h2 className="font-medium text-white">Basics</h2>
        <input
          className="w-full rounded border border-slate-600 bg-slate-800 px-3 py-2 text-white"
          value={scenario.title ?? ''}
          onChange={(e) => setScenario((s) => ({ ...s, title: e.target.value }))}
          placeholder="Scenario title"
        />
        <select
          className="rounded border border-slate-600 bg-slate-800 px-3 py-2 text-white"
          value={scenario.locale ?? 'en'}
          onChange={(e) => setScenario((s) => ({ ...s, locale: e.target.value as SimScenario['locale'] }))}
        >
          {SIM_LOCALES.map((l) => (
            <option key={l} value={l}>
              {l}
            </option>
          ))}
        </select>
        <div className="flex flex-wrap gap-4 text-sm text-slate-300">
          {(['phone', 'chat', 'email'] as const).map((ch) => (
            <label key={ch} className="flex items-center gap-2 capitalize">
              <input
                type="checkbox"
                checked={scenario.channels?.[ch] !== false}
                onChange={(e) =>
                  setScenario((s) => ({
                    ...s,
                    channels: { ...s.channels, phone: s.channels?.phone ?? true, chat: s.channels?.chat ?? true, email: s.channels?.email ?? true, [ch]: e.target.checked },
                  }))
                }
              />
              {ch}
            </label>
          ))}
        </div>
      </section>

      <section className="space-y-3 rounded-xl border border-slate-700 bg-slate-900/40 p-4">
        <h2 className="font-medium text-white">Customer persona</h2>
        <input
          className="w-full rounded border border-slate-600 bg-slate-800 px-3 py-2 text-white"
          value={scenario.persona?.name ?? ''}
          onChange={(e) => setScenario((s) => ({ ...s, persona: { ...s.persona!, name: e.target.value } }))}
          placeholder="Customer name"
        />
        <textarea
          className="min-h-[80px] w-full rounded border border-slate-600 bg-slate-800 px-3 py-2 text-white"
          value={scenario.persona?.backstory ?? ''}
          onChange={(e) => setScenario((s) => ({ ...s, persona: { ...s.persona!, backstory: e.target.value } }))}
          placeholder="Backstory"
        />
        <textarea
          className="min-h-[60px] w-full rounded border border-slate-600 bg-slate-800 px-3 py-2 text-white"
          value={scenario.persona?.opening_line ?? ''}
          onChange={(e) => setScenario((s) => ({ ...s, persona: { ...s.persona!, opening_line: e.target.value } }))}
          placeholder="Opening line (phone/chat)"
        />
      </section>

      <section className="space-y-3 rounded-xl border border-slate-700 bg-slate-900/40 p-4">
        <h2 className="font-medium text-white">CRM screenshot + overlays</h2>
        <CrmOverlayEditor skin={crmSkin} onChange={setCrmSkin} />
      </section>

      <section className="space-y-3 rounded-xl border border-slate-700 bg-slate-900/40 p-4">
        <h2 className="font-medium text-white">Import from call transcript</h2>
        <textarea
          className="min-h-[120px] w-full rounded border border-slate-600 bg-slate-800 px-3 py-2 text-sm text-white"
          value={transcript}
          onChange={(e) => setTranscript(e.target.value)}
          placeholder="Paste contact-center transcript…"
        />
        <button type="button" onClick={importFromTranscript} className="text-sm text-violet-400">
          Generate scenario from transcript
        </button>
      </section>

      <section className="space-y-3 rounded-xl border border-slate-700 bg-slate-900/40 p-4">
        <h2 className="font-medium text-white">Import from SOP / document</h2>
        <textarea
          className="min-h-[100px] w-full rounded border border-slate-600 bg-slate-800 px-3 py-2 text-sm text-white"
          value={sopText}
          onChange={(e) => setSopText(e.target.value)}
          placeholder="Paste SOP or job aid text…"
        />
        <button type="button" onClick={importFromSop} className="text-sm text-violet-400">
          Generate scenario from content
        </button>
      </section>

      <section className="space-y-3 rounded-xl border border-slate-700 bg-slate-900/40 p-4">
        <h2 className="font-medium text-white">Completion & compliance</h2>
        <label className="flex items-center gap-2 text-sm text-slate-300">
          <input
            type="checkbox"
            checked={scenario.completion_rule?.enabled ?? false}
            onChange={(e) =>
              setScenario((s) => ({
                ...s,
                completion_rule: { ...s.completion_rule!, enabled: e.target.checked },
              }))
            }
          />
          Require rubric pass for module completion
        </label>
        <label className="flex items-center gap-2 text-sm text-slate-300">
          <input
            type="checkbox"
            checked={scenario.compliance?.record_audio ?? false}
            onChange={(e) =>
              setScenario((s) => ({
                ...s,
                compliance: { ...s.compliance!, record_audio: e.target.checked },
              }))
            }
          />
          Record audio (org policy)
        </label>
      </section>
    </div>
  )
}

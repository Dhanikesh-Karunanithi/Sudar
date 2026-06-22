'use client'

import Link from 'next/link'
import { ExternalLink, Phone, Trash2 } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { cn } from '@/lib/utils'

type ScenarioOption = {
  id: string
  title: string
  status: string
}

export function ModuleSimLinkPanel({
  courseId,
  moduleId,
  linkedScenarioId,
  onLinked,
}: {
  courseId: string
  moduleId: string
  linkedScenarioId?: string | null
  onLinked: (scenarioId: string | null) => void
}) {
  const [scenarios, setScenarios] = useState<ScenarioOption[]>([])
  const [selectedId, setSelectedId] = useState(linkedScenarioId ?? '')
  const [linkedTitle, setLinkedTitle] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  const loadScenarios = useCallback(async () => {
    const res = await fetch('/api/sudarsim/scenarios')
    const data = await res.json()
    if (data.success) setScenarios(data.scenarios ?? [])
  }, [])

  useEffect(() => {
    void loadScenarios()
  }, [loadScenarios])

  useEffect(() => {
    setSelectedId(linkedScenarioId ?? '')
    if (linkedScenarioId) {
      const match = scenarios.find((s) => s.id === linkedScenarioId)
      setLinkedTitle(match?.title ?? null)
    } else {
      setLinkedTitle(null)
    }
  }, [linkedScenarioId, scenarios])

  const linkScenario = async (scenarioId: string | null) => {
    setLoading(true)
    setMessage(null)
    const res = await fetch(`/api/courses/${courseId}/modules/${moduleId}/sim`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sim_scenario_id: scenarioId }),
    })
    const data = await res.json()
    setLoading(false)
    if (!data.success) {
      setMessage(typeof data.error === 'string' ? data.error : 'Link failed')
      return
    }
    onLinked(scenarioId)
    const match = scenarios.find((s) => s.id === scenarioId)
    setLinkedTitle(match?.title ?? null)
    setMessage(scenarioId ? 'Scenario linked to module' : 'Scenario unlinked')
  }

  return (
    <div className="rounded-xl border border-violet-500/30 bg-violet-950/20 p-4 space-y-3">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-violet-100 flex items-center gap-2">
            <Phone className="h-4 w-4" aria-hidden />
            SudarSim delivery
          </p>
          <p className="text-xs text-slate-400 mt-1">
            Link a published scenario from your org library. Author scenarios in{' '}
            <Link href="/sudarsim" className="text-violet-300 hover:underline">
              SudarSim
            </Link>
            .
          </p>
        </div>
        {linkedScenarioId ? (
          <Link
            href={`/sudarsim/${linkedScenarioId}`}
            className="inline-flex items-center gap-1.5 text-xs text-violet-300 hover:text-violet-100"
          >
            Edit scenario
            <ExternalLink className="h-3.5 w-3.5" aria-hidden />
          </Link>
        ) : null}
      </div>

      {linkedScenarioId && linkedTitle ? (
        <p className="text-sm text-slate-200 flex flex-wrap items-center gap-2">
          Linked: <span className="font-medium text-white">{linkedTitle}</span>
          {scenarios.find((s) => s.id === linkedScenarioId)?.status === 'draft' ? (
            <span className="rounded-full bg-amber-500/20 px-2 py-0.5 text-xs font-medium text-amber-200">
              Draft — publish before learners can play
            </span>
          ) : null}
        </p>
      ) : null}

      <div className="flex flex-wrap items-center gap-2">
        <select
          value={selectedId}
          onChange={(e) => setSelectedId(e.target.value)}
          className="min-w-[200px] flex-1 rounded-lg border border-slate-600 bg-slate-800 px-3 py-2 text-sm text-white"
          aria-label="Select SudarSim scenario"
        >
          <option value="">— Select scenario —</option>
          {scenarios.map((s) => (
            <option key={s.id} value={s.id}>
              {s.title} ({s.status})
            </option>
          ))}
        </select>
        <button
          type="button"
          disabled={loading || !selectedId || selectedId === linkedScenarioId}
          onClick={() => void linkScenario(selectedId)}
          className={cn(
            'rounded-lg px-3 py-2 text-sm font-medium transition-colors',
            'bg-violet-600 text-white hover:bg-violet-500 disabled:opacity-50',
          )}
        >
          Link
        </button>
        {linkedScenarioId ? (
          <button
            type="button"
            disabled={loading}
            onClick={() => void linkScenario(null)}
            className="inline-flex items-center gap-1 rounded-lg border border-slate-600 px-3 py-2 text-sm text-slate-300 hover:bg-slate-800"
            aria-label="Unlink scenario"
          >
            <Trash2 className="h-3.5 w-3.5" aria-hidden />
            Unlink
          </button>
        ) : null}
      </div>

      {message ? <p className="text-xs text-emerald-400">{message}</p> : null}
    </div>
  )
}

'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Phone, Pencil, Trash2 } from 'lucide-react'
import { useState } from 'react'

export type SudarsimScenarioRow = {
  id: string
  title: string
  locale: string
  status: string
  created_at: string
  updated_at: string
}

export function SudarsimLibraryClient({ scenarios: initial }: { scenarios: SudarsimScenarioRow[] }) {
  const [scenarios, setScenarios] = useState(initial)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const deleteScenario = async (id: string) => {
    if (!window.confirm('Delete this scenario? Linked modules will lose their attachment.')) return
    setDeletingId(id)
    const res = await fetch(`/api/sudarsim/scenarios/${id}`, { method: 'DELETE' })
    setDeletingId(null)
    if (res.ok) setScenarios((prev) => prev.filter((s) => s.id !== id))
  }

  return (
    <div className="divide-y divide-slate-800 rounded-2xl border border-slate-800 bg-slate-900/50">
      {scenarios.map((s) => (
        <div key={s.id} className="flex flex-wrap items-center justify-between gap-4 px-5 py-4">
          <div className="min-w-0 flex-1">
            <p className="font-medium text-white truncate">{s.title}</p>
            <p className="text-xs text-slate-500 mt-0.5">
              {s.locale.toUpperCase()} ·{' '}
              <span className={s.status === 'published' ? 'text-emerald-400' : 'text-amber-400'}>
                {s.status}
              </span>
              {' · '}
              Updated {new Date(s.updated_at).toLocaleDateString()}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href={`/sudarsim/${s.id}`}
              className="inline-flex items-center gap-1.5 rounded-lg bg-violet-600 px-3 py-2 text-sm font-medium text-white hover:bg-violet-500"
            >
              <Pencil className="h-3.5 w-3.5" aria-hidden />
              Edit
            </Link>
            <button
              type="button"
              disabled={deletingId === s.id}
              onClick={() => void deleteScenario(s.id)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 px-3 py-2 text-sm text-slate-400 hover:bg-slate-800 hover:text-red-300"
              aria-label={`Delete ${s.title}`}
            >
              <Trash2 className="h-3.5 w-3.5" aria-hidden />
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}

export function SudarsimCreateButton() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const create = async () => {
    setLoading(true)
    const res = await fetch('/api/sudarsim/scenarios', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'New simulation' }),
    })
    const data = await res.json()
    setLoading(false)
    if (data.id) router.push(`/sudarsim/${data.id}`)
  }

  return (
    <button
      type="button"
      disabled={loading}
      onClick={() => void create()}
      className="flex items-center gap-2 px-4 py-2.5 bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white text-sm font-semibold rounded-lg transition-colors"
    >
      <Phone className="w-4 h-4" aria-hidden />
      {loading ? 'Creating…' : 'New scenario'}
    </button>
  )
}

'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Plus, Trash2, Tags } from 'lucide-react'
import { SudarInlineLoader } from '@/components/branding/SudarBrandLoader'

type CatalogGroup = {
  id: string
  name: string
  sort_order: number
  tags: { id: string; slug: string; label: string }[]
}

export default function TagLibraryPage() {
  const [loading, setLoading] = useState(true)
  const [groups, setGroups] = useState<CatalogGroup[]>([])
  const [newGroupName, setNewGroupName] = useState('')
  const [addingTo, setAddingTo] = useState<string | null>(null)
  const [newTagLabel, setNewTagLabel] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setError(null)
    const res = await fetch('/api/org/course-tags-catalog')
    if (!res.ok) {
      setError('Could not load tag library')
      setLoading(false)
      return
    }
    const data = await res.json()
    setGroups(Array.isArray(data.groups) ? data.groups : [])
    setLoading(false)
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  async function addGroup(e: React.FormEvent) {
    e.preventDefault()
    if (!newGroupName.trim()) return
    setSaving(true)
    setError(null)
    const res = await fetch('/api/org/tag-groups', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newGroupName.trim() }),
    })
    setSaving(false)
    if (!res.ok) {
      const d = await res.json().catch(() => ({}))
      setError(d.error ?? 'Failed to add group')
      return
    }
    setNewGroupName('')
    await load()
  }

  async function deleteGroup(id: string) {
    if (id === 'ungrouped') return
    if (!confirm('Delete this group? Tags become ungrouped.')) return
    setSaving(true)
    const res = await fetch(`/api/org/tag-groups/${id}`, { method: 'DELETE' })
    setSaving(false)
    if (!res.ok) {
      const d = await res.json().catch(() => ({}))
      setError(d.error ?? 'Failed to delete')
      return
    }
    await load()
  }

  async function addTag(groupId: string | null) {
    if (!newTagLabel.trim()) return
    setSaving(true)
    setError(null)
    const res = await fetch('/api/org/tags', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        label: newTagLabel.trim(),
        group_id: groupId,
      }),
    })
    setSaving(false)
    if (!res.ok) {
      const d = await res.json().catch(() => ({}))
      setError(d.error ?? 'Failed to add tag')
      return
    }
    setNewTagLabel('')
    setAddingTo(null)
    await load()
  }

  async function deleteTag(tagId: string) {
    if (!confirm('Remove this tag from the library? It will be removed from courses.')) return
    setSaving(true)
    const res = await fetch(`/api/org/tags/${tagId}`, { method: 'DELETE' })
    setSaving(false)
    if (!res.ok) {
      const d = await res.json().catch(() => ({}))
      setError(d.error ?? 'Failed to delete')
      return
    }
    await load()
  }

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <SudarInlineLoader size="sm" className="h-6 w-auto text-slate-500" starFill="var(--background)" />
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto space-y-8 pb-12">
      <div className="flex items-center gap-4">
        <Link
          href="/settings"
          className="inline-flex items-center gap-2 text-slate-400 hover:text-slate-200 text-sm transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Org settings
        </Link>
      </div>

      <div className="flex items-start gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-indigo-500/25 bg-indigo-500/10">
          <Tags className="w-6 h-6 text-indigo-300" />
        </div>
        <div>
          <h1 className="text-xl font-semibold text-white">Course tag library</h1>
          <p className="text-sm text-slate-500 mt-1">
            Group master tags for consistent catalog filters. AI may add tags under &quot;AI suggested&quot;.
          </p>
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-2 text-sm text-red-300">{error}</div>
      )}

      <form onSubmit={addGroup} className="flex flex-wrap items-end gap-2 rounded-xl border border-slate-800 bg-slate-900/50 p-4">
        <div className="flex-1 min-w-[200px]">
          <label className="text-xs font-medium text-slate-500">New group</label>
          <input
            value={newGroupName}
            onChange={(e) => setNewGroupName(e.target.value)}
            placeholder="e.g. Department, Level, Topic"
            className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
          />
        </div>
        <button
          type="submit"
          disabled={saving || !newGroupName.trim()}
          className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-50"
        >
          <Plus className="w-4 h-4" />
          Add group
        </button>
      </form>

      <div className="space-y-6">
        {groups.map((g) => (
          <div key={g.id} className="rounded-xl border border-slate-800 bg-slate-900/40 overflow-hidden">
            <div className="flex items-center justify-between gap-2 border-b border-slate-800 px-4 py-3">
              <h2 className="text-sm font-semibold text-slate-200">{g.name}</h2>
              {g.id !== 'ungrouped' && (
                <button
                  type="button"
                  onClick={() => void deleteGroup(g.id)}
                  disabled={saving}
                  className="p-1.5 text-slate-500 hover:text-red-400 rounded-lg hover:bg-slate-800"
                  aria-label={`Delete group ${g.name}`}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
            <div className="p-4 space-y-3">
              <div className="flex flex-wrap gap-2">
                {g.tags.length === 0 ? (
                  <span className="text-xs text-slate-600">No tags in this group yet.</span>
                ) : (
                  g.tags.map((t) => (
                    <span
                      key={t.id}
                      className="inline-flex items-center gap-1.5 rounded-full border border-slate-700 bg-slate-800/80 pl-2.5 pr-1 py-0.5 text-xs text-slate-300"
                    >
                      {t.label}
                      <button
                        type="button"
                        onClick={() => void deleteTag(t.id)}
                        disabled={saving}
                        className="rounded-full p-0.5 text-slate-500 hover:text-red-400"
                        aria-label={`Delete tag ${t.label}`}
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </span>
                  ))
                )}
              </div>
              {addingTo === g.id ? (
                <div className="flex flex-wrap items-center gap-2">
                  <input
                    value={newTagLabel}
                    onChange={(e) => setNewTagLabel(e.target.value)}
                    placeholder="Tag label"
                    className="flex-1 min-w-[140px] rounded-lg border border-slate-700 bg-slate-800 px-2 py-1.5 text-xs text-white"
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={() => void addTag(g.id === 'ungrouped' ? null : g.id)}
                    disabled={saving}
                    className="rounded-lg bg-slate-700 px-2 py-1 text-xs text-white hover:bg-slate-600"
                  >
                    Save
                  </button>
                  <button
                    type="button"
                    onClick={() => { setAddingTo(null); setNewTagLabel('') }}
                    className="text-xs text-slate-500 hover:text-slate-300"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => { setAddingTo(g.id); setNewTagLabel('') }}
                  className="text-xs font-medium text-indigo-400 hover:text-indigo-300"
                >
                  + Add tag
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

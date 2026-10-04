'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { Network, RefreshCw, Plus } from 'lucide-react'

type DomainRow = {
  id: string
  title: string
  source: string
  source_course_id: string | null
  updated_at: string
}

type ClaimRow = {
  id: string
  stem: string
  misconceptions: string[]
  sort_order: number
}

export default function DomainsCuratorPage() {
  const [domains, setDomains] = useState<DomainRow[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [claims, setClaims] = useState<ClaimRow[]>([])
  const [courses, setCourses] = useState<Array<{ id: string; title: string }>>([])
  const [courseId, setCourseId] = useState('')
  const [newStem, setNewStem] = useState('')
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [heatmap, setHeatmap] = useState<
    Array<{ claim_id: string; stem: string; weak_learners: number; avg_p_know: number | null }>
  >([])

  const loadDomains = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/domains')
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'Failed')
      setDomains(json.data ?? [])
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load domains')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadDomains()
    void fetch('/api/courses')
      .then((r) => r.json())
      .then((j) => {
        const list = Array.isArray(j) ? j : j.data ?? j.courses ?? []
        setCourses(
          (list as Array<{ id: string; title: string }>).map((c) => ({
            id: c.id,
            title: c.title,
          })),
        )
      })
      .catch(() => {})
  }, [loadDomains])

  async function loadDomain(id: string) {
    setSelectedId(id)
    setBusy(true)
    try {
      const [detail, heat] = await Promise.all([
        fetch(`/api/domains/${id}`).then((r) => r.json()),
        fetch(`/api/analytics/claim-struggle?domain_id=${id}`).then((r) => r.json()),
      ])
      setClaims(detail.data?.claims ?? [])
      setHeatmap(heat.data ?? [])
    } finally {
      setBusy(false)
    }
  }

  async function seedFromCourse() {
    if (!courseId) return
    setBusy(true)
    setError(null)
    try {
      const res = await fetch('/api/domains', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ course_id: courseId, replace_claims: false }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'Seed failed')
      await loadDomains()
      if (json.data?.domainId) await loadDomain(json.data.domainId)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Seed failed')
    } finally {
      setBusy(false)
    }
  }

  async function addClaim() {
    if (!selectedId || !newStem.trim()) return
    setBusy(true)
    try {
      const res = await fetch(`/api/domains/${selectedId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stem: newStem.trim() }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'Failed')
      setNewStem('')
      await loadDomain(selectedId)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6 p-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Network className="w-6 h-6 text-primary" /> Domain curator
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Teaching OS claim graphs — seed from a course, edit stems, view struggle heat.
          </p>
        </div>
        <Link href="/analytics" className="text-sm text-primary hover:underline">
          Analytics →
        </Link>
      </div>

      {error && (
        <p className="text-sm text-destructive bg-destructive/10 rounded-lg px-3 py-2">{error}</p>
      )}

      <div className="rounded-xl border border-border bg-card p-4 space-y-3">
        <p className="text-sm font-medium text-foreground">Seed from course</p>
        <div className="flex flex-wrap gap-2 items-center">
          <select
            className="text-sm border border-border rounded-lg px-3 py-2 bg-background min-w-[220px]"
            value={courseId}
            onChange={(e) => setCourseId(e.target.value)}
            aria-label="Course to seed"
          >
            <option value="">Select published course…</option>
            {courses.map((c) => (
              <option key={c.id} value={c.id}>
                {c.title}
              </option>
            ))}
          </select>
          <button
            type="button"
            disabled={!courseId || busy}
            onClick={() => void seedFromCourse()}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium disabled:opacity-50"
          >
            <RefreshCw className="w-4 h-4" /> Seed domain
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="md:col-span-1 rounded-xl border border-border bg-card p-3 space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Domains</p>
          {loading ? (
            <p className="text-sm text-muted-foreground">Loading…</p>
          ) : domains.length === 0 ? (
            <p className="text-sm text-muted-foreground">No domains yet. Seed a course.</p>
          ) : (
            domains.map((d) => (
              <button
                key={d.id}
                type="button"
                onClick={() => void loadDomain(d.id)}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                  selectedId === d.id ? 'bg-primary/10 text-primary' : 'hover:bg-muted'
                }`}
              >
                <span className="font-medium line-clamp-1">{d.title}</span>
                <span className="block text-xs text-muted-foreground">{d.source}</span>
              </button>
            ))
          )}
        </div>

        <div className="md:col-span-2 space-y-4">
          <div className="rounded-xl border border-border bg-card p-4 space-y-3">
            <p className="text-sm font-medium">Claims</p>
            {!selectedId ? (
              <p className="text-sm text-muted-foreground">Select a domain.</p>
            ) : (
              <>
                <ul className="space-y-2 max-h-80 overflow-y-auto">
                  {claims.map((c) => (
                    <li key={c.id} className="text-sm border-b border-border/60 pb-2">
                      <span className="text-foreground">{c.stem}</span>
                      {c.misconceptions?.[0] && (
                        <span className="block text-xs text-muted-foreground mt-0.5">
                          Misconception: {c.misconceptions[0]}
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
                <div className="flex gap-2">
                  <input
                    className="flex-1 text-sm border border-border rounded-lg px-3 py-2 bg-background"
                    placeholder="New claim stem…"
                    value={newStem}
                    onChange={(e) => setNewStem(e.target.value)}
                    aria-label="New claim stem"
                  />
                  <button
                    type="button"
                    disabled={busy || !newStem.trim()}
                    onClick={() => void addClaim()}
                    className="inline-flex items-center gap-1 px-3 py-2 rounded-lg border border-border text-sm disabled:opacity-50"
                  >
                    <Plus className="w-4 h-4" /> Add
                  </button>
                </div>
              </>
            )}
          </div>

          {heatmap.length > 0 && (
            <div className="rounded-xl border border-border bg-card p-4 space-y-2">
              <p className="text-sm font-medium">Claim struggle</p>
              <ul className="space-y-1 text-sm">
                {heatmap.slice(0, 8).map((h) => (
                  <li key={h.claim_id} className="flex justify-between gap-2">
                    <span className="line-clamp-1">{h.stem}</span>
                    <span className="text-xs text-muted-foreground shrink-0">
                      {h.weak_learners} weak
                      {h.avg_p_know != null ? ` · avg ${Math.round(h.avg_p_know * 100)}%` : ''}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

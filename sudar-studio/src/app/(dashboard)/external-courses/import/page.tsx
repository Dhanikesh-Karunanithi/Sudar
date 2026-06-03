'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Download, Search } from 'lucide-react'
import { SudarInlineLoader } from '@/components/branding/SudarBrandLoader'
import { IMPORTABLE_PROVIDERS } from '@/lib/providers'

type SearchResult = {
  providerCourseId: string
  title: string
  description: string | null
  externalUrl: string
}

type OrgTag = { id: string; label: string }

export default function ExternalCoursesImportPage() {
  const [provider, setProvider] = useState('youtube')
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [selected, setSelected] = useState<SearchResult | null>(null)
  const [preview, setPreview] = useState<Record<string, unknown> | null>(null)
  const [tagSuggestion, setTagSuggestion] = useState<{ suggestedLabels?: string[]; matchedTagIds?: string[] } | null>(null)
  const [orgTags, setOrgTags] = useState<OrgTag[]>([])
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([])
  const [contentAccessMode, setContentAccessMode] = useState<'iframe_only' | 'tutor_access' | 'both'>('both')
  const [loading, setLoading] = useState(false)
  const [importing, setImporting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const [manualTitle, setManualTitle] = useState('')
  const [manualUrl, setManualUrl] = useState('')
  const [manualDescription, setManualDescription] = useState('')

  const loadTags = useCallback(async () => {
    const res = await fetch('/api/org/course-tags-catalog')
    if (!res.ok) return
    const data = await res.json()
    const flat: OrgTag[] = []
    for (const g of data.groups ?? []) {
      for (const t of g.tags ?? []) flat.push({ id: t.id, label: t.label })
    }
    setOrgTags(flat)
  }, [])

  useEffect(() => {
    void loadTags()
  }, [loadTags])

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    setSelected(null)
    setPreview(null)

    const res = await fetch(
      `/api/org/external-courses/search?provider=${encodeURIComponent(provider)}&q=${encodeURIComponent(query)}`,
    )
    setLoading(false)
    if (!res.ok) {
      setError('Search failed')
      return
    }
    const data = await res.json()
    setResults(data.results ?? [])
  }

  async function loadPreview(item: SearchResult) {
    setSelected(item)
    setError(null)
    setLoading(true)
    const res = await fetch(
      `/api/org/external-courses/import?provider=${encodeURIComponent(provider)}&provider_course_id=${encodeURIComponent(item.providerCourseId)}`,
    )
    setLoading(false)
    if (!res.ok) {
      setError('Could not load preview')
      return
    }
    const data = await res.json()
    setPreview(data.metadata ?? null)
    setTagSuggestion(data.tagSuggestion ?? null)
    const matched = (data.tagSuggestion?.matchedTagIds as string[]) ?? []
    setSelectedTagIds(matched)
  }

  async function handleImport() {
    setImporting(true)
    setError(null)
    setSuccess(null)

    const body =
      provider === 'manual'
        ? {
            provider: 'manual',
            content_access_mode: contentAccessMode,
            auto_tag: selectedTagIds.length === 0,
            org_tag_ids: selectedTagIds.length ? selectedTagIds : undefined,
            manual: {
              title: manualTitle,
              external_url: manualUrl,
              description: manualDescription || null,
            },
          }
        : {
            provider,
            provider_course_id: selected?.providerCourseId,
            content_access_mode: contentAccessMode,
            auto_tag: selectedTagIds.length === 0,
            org_tag_ids: selectedTagIds.length ? selectedTagIds : undefined,
            publish: true,
          }

    const res = await fetch('/api/org/external-courses/import', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    setImporting(false)
    const data = await res.json()
    if (!res.ok) {
      setError(data.error ?? 'Import failed')
      return
    }
    setSuccess(`Imported course ${data.course_id}`)
  }

  function toggleTag(id: string) {
    setSelectedTagIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <Link href="/settings/external-courses" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="w-4 h-4" />
        External courses settings
      </Link>

      <div>
        <h1 className="text-2xl font-bold">Import external course</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Bring courses from YouTube, Udemy, Coursera, edX, Khan Academy, or any URL. Tag them for NBA and tutor recommendations.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <label className="block space-y-1">
          <span className="text-sm font-medium">Provider</span>
          <select
            value={provider}
            onChange={(e) => setProvider(e.target.value)}
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
          >
            {IMPORTABLE_PROVIDERS.map((p) => (
              <option key={p.slug} value={p.slug}>
                {p.label}
              </option>
            ))}
          </select>
        </label>

        <label className="block space-y-1">
          <span className="text-sm font-medium">Tutor access</span>
          <select
            value={contentAccessMode}
            onChange={(e) => setContentAccessMode(e.target.value as typeof contentAccessMode)}
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
          >
            <option value="both">Iframe + tutor discussion</option>
            <option value="tutor_access">Tutor only (link out)</option>
            <option value="iframe_only">Iframe only (no tutor content)</option>
          </select>
        </label>
      </div>

      {provider === 'manual' ? (
        <div className="space-y-3 rounded-xl border border-border p-4">
          <input
            placeholder="Course title"
            value={manualTitle}
            onChange={(e) => setManualTitle(e.target.value)}
            className="w-full rounded-lg border border-border px-3 py-2 text-sm"
          />
          <input
            placeholder="https://..."
            value={manualUrl}
            onChange={(e) => setManualUrl(e.target.value)}
            className="w-full rounded-lg border border-border px-3 py-2 text-sm"
          />
          <textarea
            placeholder="Description (optional)"
            value={manualDescription}
            onChange={(e) => setManualDescription(e.target.value)}
            className="w-full rounded-lg border border-border px-3 py-2 text-sm min-h-[80px]"
          />
        </div>
      ) : (
        <form onSubmit={handleSearch} className="flex gap-2">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search or paste playlist / course ID / URL"
            className="flex-1 rounded-lg border border-border px-3 py-2 text-sm"
          />
          <button
            type="submit"
            disabled={loading || !query.trim()}
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium disabled:opacity-60"
          >
            {loading ? <SudarInlineLoader size="sm" /> : <Search className="w-4 h-4" />}
            Search
          </button>
        </form>
      )}

      {results.length > 0 && (
        <ul className="divide-y divide-border rounded-xl border border-border overflow-hidden">
          {results.map((r) => (
            <li key={r.providerCourseId}>
              <button
                type="button"
                onClick={() => void loadPreview(r)}
                className="w-full text-left px-4 py-3 hover:bg-muted/50 transition-colors"
              >
                <p className="font-medium text-sm">{r.title}</p>
                {r.description && <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">{r.description}</p>}
              </button>
            </li>
          ))}
        </ul>
      )}

      {preview && (
        <div className="rounded-xl border border-border p-4 space-y-2 bg-muted/20">
          <p className="font-semibold">{(preview as { title?: string }).title}</p>
          <p className="text-sm text-muted-foreground">{(preview as { description?: string }).description}</p>
          {tagSuggestion?.suggestedLabels?.length ? (
            <p className="text-xs text-muted-foreground">
              Suggested tags: {tagSuggestion.suggestedLabels.join(', ')}
            </p>
          ) : null}
        </div>
      )}

      {orgTags.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium">Org tags</p>
          <div className="flex flex-wrap gap-2">
            {orgTags.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => toggleTag(t.id)}
                className={`px-3 py-1 rounded-full text-xs border ${
                  selectedTagIds.includes(t.id)
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'border-border bg-background'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {error && <p className="text-sm text-destructive">{error}</p>}
      {success && <p className="text-sm text-success">{success}</p>}

      <button
        type="button"
        onClick={() => void handleImport()}
        disabled={importing || (provider !== 'manual' && !selected) || (provider === 'manual' && (!manualTitle || !manualUrl))}
        className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground rounded-lg font-medium disabled:opacity-60"
      >
        {importing ? <SudarInlineLoader size="sm" /> : <Download className="w-4 h-4" />}
        Import & publish
      </button>
    </div>
  )
}

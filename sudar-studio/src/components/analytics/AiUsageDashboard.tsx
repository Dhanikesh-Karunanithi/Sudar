'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { Download, RefreshCw } from 'lucide-react'

type FeatureRow = {
  feature: string
  request_count: number
  prompt_tokens: number
  completion_tokens: number
  total_tokens: number
  estimated_cost_usd: number
}

type SummaryPayload = {
  from: string
  to: string
  estimate_disclaimer: string
  totals: FeatureRow
  by_feature: FeatureRow[]
}

const FEATURE_LABELS: Record<string, string> = {
  tutor_chat: 'Sudar tutor chat',
  tutor_proactive: 'Proactive tutor',
  tutor_workflow: 'Tutor workflows',
  next_best_action: 'Next best action',
  module_personalize: 'Module personalization',
  studio_agent: 'Studio Sudar agent',
  course_generation: 'Course generation',
  studio_assist: 'Studio assist / edits',
  modality_mindmap: 'Mind maps',
  modality_flashcards: 'Flashcards',
  modality_listen: 'Listen (TTS)',
  modality_watch: 'Watch (video)',
  modality_image: 'Images',
  rag_ingest: 'RAG ingest',
  rag_query: 'RAG query embed',
  memory_consolidation: 'Memory consolidation',
  intelligence_other: 'Intelligence (other)',
}

function formatFeature(key: string): string {
  return FEATURE_LABELS[key] ?? key.replace(/_/g, ' ')
}

function formatTokens(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(2)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`
  return String(n)
}

function formatUsd(n: number): string {
  if (n < 0.01 && n > 0) return '< $0.01'
  return `$${n.toFixed(2)}`
}

export function AiUsageDashboard() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [summary, setSummary] = useState<SummaryPayload | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/org/ai-usage/summary')
      const json = await res.json()
      if (!res.ok) {
        setError(json.error ?? 'Failed to load AI usage')
        return
      }
      setSummary(json.data as SummaryPayload)
    } catch {
      setError('Failed to load AI usage')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  if (loading) {
    return <p className="text-sm text-muted-foreground">Loading AI usage…</p>
  }

  if (error) {
    return (
      <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
        {error}
        <button type="button" className="ml-3 underline" onClick={() => void load()}>
          Retry
        </button>
      </div>
    )
  }

  if (!summary) return null

  const { totals, by_feature } = summary

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm text-muted-foreground">
            Period: {summary.from} → {summary.to}
          </p>
          <p className="mt-1 max-w-2xl text-xs text-muted-foreground">{summary.estimate_disclaimer}</p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => void load()}
            className="inline-flex items-center gap-2 rounded-md border px-3 py-1.5 text-sm hover:bg-muted"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </button>
          <a
            href={`/api/org/ai-usage/export?from=${summary.from}&to=${summary.to}`}
            className="inline-flex items-center gap-2 rounded-md border px-3 py-1.5 text-sm hover:bg-muted"
          >
            <Download className="h-4 w-4" />
            Export CSV
          </a>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border bg-card p-4 shadow-sm">
          <p className="text-xs font-medium uppercase text-muted-foreground">Total tokens</p>
          <p className="mt-2 text-2xl font-semibold">{formatTokens(totals.total_tokens)}</p>
          <p className="mt-1 text-xs text-muted-foreground">
            In: {formatTokens(totals.prompt_tokens)} · Out: {formatTokens(totals.completion_tokens)}
          </p>
        </div>
        <div className="rounded-xl border bg-card p-4 shadow-sm">
          <p className="text-xs font-medium uppercase text-muted-foreground">AI requests</p>
          <p className="mt-2 text-2xl font-semibold">{totals.request_count.toLocaleString()}</p>
        </div>
        <div className="rounded-xl border bg-card p-4 shadow-sm">
          <p className="text-xs font-medium uppercase text-muted-foreground">Est. marginal cost</p>
          <p className="mt-2 text-2xl font-semibold">{formatUsd(totals.estimated_cost_usd)}</p>
        </div>
      </div>

      <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
        <div className="border-b px-4 py-3">
          <h2 className="font-semibold">Usage by feature</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/40 text-left text-xs uppercase text-muted-foreground">
                <th className="px-4 py-2">Feature</th>
                <th className="px-4 py-2 text-right">Requests</th>
                <th className="px-4 py-2 text-right">Tokens</th>
                <th className="px-4 py-2 text-right">Est. cost</th>
              </tr>
            </thead>
            <tbody>
              {by_feature.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-muted-foreground">
                    No AI usage recorded yet. Usage appears after LLM calls run with metering enabled.
                    Daily rollups run via cron — see{' '}
                    <code className="text-xs">POST /api/cron/ai-usage-rollups</code>.
                  </td>
                </tr>
              ) : (
                by_feature.map((row) => (
                  <tr key={row.feature} className="border-b last:border-0">
                    <td className="px-4 py-2 font-medium">{formatFeature(row.feature)}</td>
                    <td className="px-4 py-2 text-right tabular-nums">{row.request_count}</td>
                    <td className="px-4 py-2 text-right tabular-nums">{formatTokens(row.total_tokens)}</td>
                    <td className="px-4 py-2 text-right tabular-nums">{formatUsd(row.estimated_cost_usd)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <p className="text-xs text-muted-foreground">
        Methodology:{' '}
        <Link href="https://github.com/Dhanikesh-Karunanithi/Sudar/blob/main/docs/research/COST_WORKSHEET.md" className="underline">
          COST_WORKSHEET.md
        </Link>
      </p>
    </div>
  )
}

'use client'

import { useCallback, useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, RefreshCw, ExternalLink, CheckCircle2, AlertTriangle, ShieldAlert, ChevronDown } from 'lucide-react'
import type { GenerationTelemetry } from '@/lib/ai/courseGeneration/types'
import { issueKey, RUBRIC_DIMENSIONS, type StoredModuleQuality } from '@shared-content-generation/quality'
import { SudarInlineLoader } from '@/components/branding/SudarBrandLoader'
import { cn } from '@/lib/utils'

type CourseQualityResponse = {
  id: string
  title: string
  settings?: { ai_generation?: { generation_telemetry?: GenerationTelemetry } }
}

type ReviewStatus = 'draft' | 'needs_review' | 'approved'

type ModuleQualityRow = {
  id: string
  title: string
  order_index: number
  review_status: ReviewStatus
  reviewed_at: string | null
  quality: StoredModuleQuality | null
  unresolved_critical: number
}

const DIMENSION_LABELS: Record<string, string> = {
  objective_alignment: 'Objective alignment',
  bloom_fit: 'Bloom level fit',
  retrieval_practice: 'Retrieval practice',
  worked_examples: 'Worked examples',
  cognitive_load: 'Cognitive load',
  accuracy_risk: 'Accuracy (low risk)',
  interactivity: 'Interactivity',
  clarity: 'Clarity',
  engagement: 'Engagement',
}

const STATUS_STYLES: Record<ReviewStatus, string> = {
  approved: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
  draft: 'bg-slate-500/15 text-slate-300 border-slate-500/30',
  needs_review: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
}

const STATUS_LABELS: Record<ReviewStatus, string> = {
  approved: 'Approved',
  draft: 'Draft (passed automated review)',
  needs_review: 'Needs review',
}

export default function CourseQualityPage() {
  const params = useParams()
  const id = typeof params.id === 'string' ? params.id : ''
  const [loading, setLoading] = useState(true)
  const [course, setCourse] = useState<CourseQualityResponse | null>(null)
  const [modules, setModules] = useState<ModuleQualityRow[]>([])
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!id) return
    const [courseRes, qualityRes] = await Promise.all([fetch(`/api/courses/${id}`), fetch(`/api/courses/${id}/quality`)])
    if (!courseRes.ok) {
      setError('Could not load course')
      setLoading(false)
      return
    }
    setCourse((await courseRes.json()) as CourseQualityResponse)
    if (qualityRes.ok) {
      const body = (await qualityRes.json()) as { data?: { modules: ModuleQualityRow[] } }
      setModules(body.data?.modules ?? [])
    }
    setLoading(false)
  }, [id])

  useEffect(() => {
    void load()
  }, [load])

  const telemetry = course?.settings?.ai_generation?.generation_telemetry

  async function regenerateAllModules() {
    setBusy('all')
    setError(null)
    try {
      const res = await fetch('/api/ai/generate-all-modules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ course_id: id }),
      })
      if (!res.ok) {
        const data = (await res.json()) as { error?: string }
        setError(data.error ?? 'Regeneration failed')
        return
      }
      await load()
    } catch {
      setError('Regeneration failed')
    } finally {
      setBusy(null)
    }
  }

  async function review(
    moduleId: string,
    body: { action: 'approve' } | { action: 'needs_review' } | { action: 'resolve_issue'; issue_key: string }
  ) {
    setBusy(moduleId)
    setError(null)
    try {
      const res = await fetch(`/api/courses/${id}/quality`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ module_id: moduleId, ...body }),
      })
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string }
        setError(data.error ?? 'Update failed')
        return
      }
      await load()
    } finally {
      setBusy(null)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <SudarInlineLoader size="lg" />
      </div>
    )
  }

  const needsReview = modules.filter((m) => m.review_status === 'needs_review').length
  const blocking = modules.filter((m) => m.review_status !== 'approved' && m.unresolved_critical > 0).length

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      <div className="flex items-center gap-3">
        <Link href={`/courses/${id}`} aria-label="Back to course" className="text-slate-400 hover:text-white transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-xl font-semibold text-white">Content quality</h1>
          <p className="text-sm text-slate-500">{course?.title}</p>
        </div>
      </div>

      {error && (
        <div role="alert" className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {error}
        </div>
      )}

      <div className="grid gap-4 grid-cols-2 sm:grid-cols-4">
        <Stat label="Average score" value={telemetry?.average_quality_score ?? telemetry?.quality_score ?? '—'} suffix=" / 10" />
        <Stat label="Needs review" value={needsReview} />
        <Stat label="Blocking publish" value={blocking} tone={blocking > 0 ? 'danger' : undefined} />
        <Stat label="Regeneration passes" value={telemetry?.critique_passes ?? 0} />
      </div>

      <p className="text-xs text-slate-500">
        Every AI-generated module is scored against a learning-science rubric, regenerated with the reviewer&apos;s critique
        when it scores below {telemetry?.quality_threshold ?? 7}/10, and moderated. Modules with unresolved critical issues
        block publishing until you fix, resolve, or approve them.
      </p>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => void regenerateAllModules()}
          disabled={busy !== null}
          className="inline-flex items-center gap-2 rounded-lg border border-slate-600 bg-slate-800 px-4 py-2 text-sm text-white hover:bg-slate-700 disabled:opacity-50"
        >
          {busy === 'all' ? <SudarInlineLoader size="sm" /> : <RefreshCw className="w-4 h-4" />}
          Generate empty modules
        </button>
        <Link
          href={`/courses/${id}`}
          className="inline-flex items-center gap-2 rounded-lg border border-slate-600 px-4 py-2 text-sm text-slate-300 hover:text-white"
        >
          Edit in Studio
        </Link>
        <Link
          href={`/courses/${id}/preview`}
          className="inline-flex items-center gap-2 rounded-lg border border-slate-600 px-4 py-2 text-sm text-slate-300 hover:text-white"
        >
          <ExternalLink className="w-4 h-4" /> Preview
        </Link>
      </div>

      <div className="space-y-3">
        <h2 className="text-sm font-medium text-slate-300">Modules</h2>
        {modules.length === 0 ? (
          <p className="text-sm text-slate-500">No modules yet. Generate modules with AI to see quality reviews.</p>
        ) : (
          modules.map((m) => (
            <ModuleCard key={m.id} module={m} busy={busy === m.id} onReview={(body) => void review(m.id, body)} />
          ))
        )}
      </div>
    </div>
  )
}

function Stat({ label, value, suffix, tone }: { label: string; value: string | number; suffix?: string; tone?: 'danger' }) {
  return (
    <div className={cn('rounded-xl border p-4', tone === 'danger' ? 'border-red-500/30 bg-red-950/20' : 'border-slate-700 bg-slate-800/50')}>
      <p className="text-xs text-slate-500 uppercase tracking-wide">{label}</p>
      <p className="text-2xl font-semibold text-white mt-1">
        {value}
        {suffix && <span className="text-sm text-slate-500 font-normal">{suffix}</span>}
      </p>
    </div>
  )
}

function ModuleCard({
  module,
  busy,
  onReview,
}: {
  module: ModuleQualityRow
  busy: boolean
  onReview: (body: { action: 'approve' } | { action: 'needs_review' } | { action: 'resolve_issue'; issue_key: string }) => void
}) {
  const [open, setOpen] = useState(module.review_status === 'needs_review')
  const q = module.quality
  const resolved = new Set(q?.resolved_issue_keys ?? [])
  const issues = q?.issues ?? []
  const Icon = module.unresolved_critical > 0 ? ShieldAlert : module.review_status === 'needs_review' ? AlertTriangle : CheckCircle2

  return (
    <div
      className={cn(
        'rounded-xl border',
        module.unresolved_critical > 0
          ? 'border-red-500/30 bg-red-950/10'
          : module.review_status === 'needs_review'
            ? 'border-amber-500/30 bg-amber-950/10'
            : 'border-slate-700 bg-slate-800/40'
      )}
    >
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="w-full flex flex-wrap items-center justify-between gap-3 px-4 py-3 text-left"
      >
        <div className="flex items-start gap-3 min-w-0">
          <Icon
            className={cn(
              'w-5 h-5 shrink-0 mt-0.5',
              module.unresolved_critical > 0 ? 'text-red-400' : module.review_status === 'needs_review' ? 'text-amber-400' : 'text-emerald-400'
            )}
          />
          <div className="min-w-0">
            <p className="text-sm font-medium text-white truncate">{module.title}</p>
            <p className="text-xs text-slate-500">
              {q ? (q.overall != null ? `Score ${q.overall}/10` : 'Not scored') : 'No automated review'} · {issues.length} issue
              {issues.length === 1 ? '' : 's'}
              {q && q.attempts.length > 1 ? ` · ${q.attempts.length} attempts` : ''}
              {q?.moderation ? ` · moderation: ${q.moderation.allowed ? 'passed' : 'flagged'} (${q.moderation.provider})` : ''}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className={cn('rounded-full border px-2 py-0.5 text-[11px] font-medium', STATUS_STYLES[module.review_status])}>
            {STATUS_LABELS[module.review_status]}
          </span>
          <ChevronDown className={cn('w-4 h-4 text-slate-500 transition-transform', open && 'rotate-180')} />
        </div>
      </button>

      {open && (
        <div className="border-t border-slate-700/60 px-4 py-4 space-y-4">
          {q && Object.keys(q.scores).length > 0 && (
            <div className="grid gap-2 sm:grid-cols-3">
              {RUBRIC_DIMENSIONS.filter((d) => typeof q.scores[d] === 'number').map((d) => {
                const s = q.scores[d]!
                return (
                  <div key={d}>
                    <div className="flex justify-between text-[11px] text-slate-400">
                      <span>{DIMENSION_LABELS[d] ?? d}</span>
                      <span>{s}</span>
                    </div>
                    <div className="mt-1 h-1.5 rounded-full bg-slate-700">
                      <div
                        className={cn('h-1.5 rounded-full', s >= 7 ? 'bg-emerald-400' : s >= 5 ? 'bg-amber-400' : 'bg-red-400')}
                        style={{ width: `${s * 10}%` }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {issues.length === 0 ? (
            <p className="text-xs text-slate-500">No issues recorded.</p>
          ) : (
            <ul className="space-y-2">
              {issues.map((issue) => {
                const key = issueKey(issue)
                const isResolved = resolved.has(key)
                return (
                  <li key={key} className={cn('rounded-lg border border-slate-700/60 px-3 py-2 text-sm', isResolved && 'opacity-50')}>
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div className="min-w-0">
                        <span
                          className={cn(
                            'mr-2 rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase',
                            issue.severity === 'critical'
                              ? 'bg-red-500/20 text-red-300'
                              : issue.severity === 'warning'
                                ? 'bg-amber-500/20 text-amber-300'
                                : 'bg-slate-500/20 text-slate-300'
                          )}
                        >
                          {issue.severity}
                        </span>
                        <span className="text-[11px] text-slate-500">{DIMENSION_LABELS[issue.dimension] ?? issue.dimension}</span>
                        <p className="text-slate-200 mt-1">{issue.description}</p>
                        {issue.suggestion && <p className="text-xs text-slate-400 mt-1">Fix: {issue.suggestion}</p>}
                        {issue.quote && <p className="text-xs text-slate-500 mt-1 italic">“{issue.quote}”</p>}
                      </div>
                      {!isResolved && issue.severity !== 'info' && (
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => onReview({ action: 'resolve_issue', issue_key: key })}
                          className="text-xs text-violet-300 hover:text-violet-200 disabled:opacity-50"
                        >
                          Mark resolved
                        </button>
                      )}
                    </div>
                  </li>
                )
              })}
            </ul>
          )}

          <div className="flex flex-wrap gap-2">
            {module.review_status !== 'approved' ? (
              <button
                type="button"
                disabled={busy}
                onClick={() => onReview({ action: 'approve' })}
                className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-500 disabled:opacity-50"
              >
                {busy ? <SudarInlineLoader size="sm" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                Approve module
              </button>
            ) : (
              <button
                type="button"
                disabled={busy}
                onClick={() => onReview({ action: 'needs_review' })}
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-600 px-3 py-1.5 text-xs text-slate-300 hover:text-white disabled:opacity-50"
              >
                Send back to review
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

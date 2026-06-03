'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, RefreshCw, ExternalLink, CheckCircle2, AlertTriangle } from 'lucide-react'
import type { GenerationTelemetry, ModuleQualityRecord } from '@/lib/ai/courseGeneration/types'
import { SudarInlineLoader } from '@/components/branding/SudarBrandLoader'
import { cn } from '@/lib/utils'

type CourseQualityResponse = {
  id: string
  title: string
  settings?: {
    ai_generation?: {
      generation_telemetry?: GenerationTelemetry
    }
  }
}

export default function CourseQualityPage() {
  const params = useParams()
  const id = typeof params.id === 'string' ? params.id : ''
  const [loading, setLoading] = useState(true)
  const [course, setCourse] = useState<CourseQualityResponse | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [regenerating, setRegenerating] = useState<string | null>(null)

  useEffect(() => {
    if (!id) return
    void (async () => {
      const res = await fetch(`/api/courses/${id}`)
      if (!res.ok) {
        setError('Could not load course')
        setLoading(false)
        return
      }
      setCourse((await res.json()) as CourseQualityResponse)
      setLoading(false)
    })()
  }, [id])

  const telemetry = course?.settings?.ai_generation?.generation_telemetry
  const modules = telemetry?.module_quality ?? []

  async function regenerateAllModules() {
    setRegenerating('all')
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
      const refresh = await fetch(`/api/courses/${id}`)
      if (refresh.ok) setCourse((await refresh.json()) as CourseQualityResponse)
    } catch {
      setError('Regeneration failed')
    } finally {
      setRegenerating(null)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <SudarInlineLoader size="lg" />
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto px-6 py-8 space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href={`/courses/${id}`}
          className="text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-xl font-semibold text-white">Content quality</h1>
          <p className="text-sm text-slate-500">{course?.title}</p>
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {error}
        </div>
      )}

      {!telemetry ? (
        <div className="rounded-xl border border-slate-700 bg-slate-800/40 p-6 text-sm text-slate-400">
          No generation telemetry yet. Generate or refill modules with AI to see quality scores.
          <div className="mt-4">
            <button
              type="button"
              onClick={() => void regenerateAllModules()}
              disabled={regenerating !== null}
              className="inline-flex items-center gap-2 rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white hover:bg-violet-500 disabled:opacity-50"
            >
              {regenerating ? <SudarInlineLoader size="sm" /> : <RefreshCw className="w-4 h-4" />}
              Regenerate all modules
            </button>
          </div>
        </div>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-xl border border-slate-700 bg-slate-800/50 p-4">
              <p className="text-xs text-slate-500 uppercase tracking-wide">Average score</p>
              <p className="text-2xl font-semibold text-white mt-1">
                {telemetry.average_quality_score ?? telemetry.quality_score ?? '—'}
                <span className="text-sm text-slate-500 font-normal"> / 10</span>
              </p>
            </div>
            <div className="rounded-xl border border-slate-700 bg-slate-800/50 p-4">
              <p className="text-xs text-slate-500 uppercase tracking-wide">Issues found</p>
              <p className="text-2xl font-semibold text-white mt-1">
                {telemetry.quality_issues_found ?? 0}
              </p>
            </div>
            <div className="rounded-xl border border-slate-700 bg-slate-800/50 p-4">
              <p className="text-xs text-slate-500 uppercase tracking-wide">Critique passes</p>
              <p className="text-2xl font-semibold text-white mt-1">{telemetry.critique_passes}</p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => void regenerateAllModules()}
              disabled={regenerating !== null}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-600 bg-slate-800 px-4 py-2 text-sm text-white hover:bg-slate-700 disabled:opacity-50"
            >
              {regenerating === 'all' ? <SudarInlineLoader size="sm" /> : <RefreshCw className="w-4 h-4" />}
              Regenerate all empty modules
            </button>
            <Link
              href={`/courses/${id}`}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-600 px-4 py-2 text-sm text-slate-300 hover:text-white"
            >
              Edit in Studio
            </Link>
          </div>

          <div className="space-y-3">
            <h2 className="text-sm font-medium text-slate-300">Per-module scores</h2>
            {modules.length === 0 ? (
              <p className="text-sm text-slate-500">No per-module breakdown stored for this run.</p>
            ) : (
              modules.map((m: ModuleQualityRecord) => (
                <ModuleQualityRow key={m.module_id} module={m} courseId={id} />
              ))
            )}
          </div>
        </>
      )}
    </div>
  )
}

function ModuleQualityRow({ module, courseId }: { module: ModuleQualityRecord; courseId: string }) {
  const low = module.quality_score < 7
  return (
    <div
      className={cn(
        'flex flex-wrap items-center justify-between gap-3 rounded-xl border px-4 py-3',
        low ? 'border-amber-500/30 bg-amber-950/20' : 'border-slate-700 bg-slate-800/40'
      )}
    >
      <div className="flex items-start gap-3 min-w-0">
        {low ? (
          <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
        ) : (
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
        )}
        <div className="min-w-0">
          <p className="text-sm font-medium text-white truncate">{module.module_title}</p>
          <p className="text-xs text-slate-500">
            Score {module.quality_score}/10 · {module.issues_count} issue
            {module.issues_count === 1 ? '' : 's'}
          </p>
        </div>
      </div>
      <Link
        href={`/courses/${courseId}/preview`}
        className="inline-flex items-center gap-1.5 text-xs font-medium text-violet-300 hover:text-violet-200"
      >
        <ExternalLink className="w-3.5 h-3.5" />
        Preview
      </Link>
    </div>
  )
}

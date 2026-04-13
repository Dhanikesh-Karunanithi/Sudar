'use client'

import { useEffect, useMemo, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Download, ExternalLink, FileText, Globe } from 'lucide-react'
import { CourseAppearancePanel } from '@/components/course/CourseAppearancePanel'
import { CourseExportDialog } from '@/components/course/CourseExportDialog'
import { CourseStudioWorkspace } from '@/components/course/CourseStudioWorkspace'
import type { PreviewModule } from '@/components/course/CourseModuleContent'
import { SudarInlineLoader } from '@/components/branding/SudarBrandLoader'
import { cn } from '@/lib/utils'

type ModuleRow = {
  id: string
  title: string
  order_index: number
  content?: unknown
}

type CourseState = {
  id: string
  title: string
  description: string | null
  thumbnail_url: string | null
  banner_url: string | null
  status: string
  difficulty: string | null
  estimated_duration_mins: number | null
  modules?: ModuleRow[]
}

export default function CourseDetailPage() {
  const params = useParams()
  const id = typeof params.id === 'string' ? params.id : ''
  const [loading, setLoading] = useState(true)
  const [course, setCourse] = useState<CourseState | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [publishing, setPublishing] = useState(false)
  const [publishError, setPublishError] = useState<string | null>(null)
  const [exportingJson, setExportingJson] = useState(false)
  const [exportError, setExportError] = useState<string | null>(null)

  useEffect(() => {
    if (!id) return
    let cancelled = false
    void (async () => {
      const res = await fetch(`/api/courses/${id}`)
      if (cancelled) return
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string }
        setError(data.error ?? 'Could not load course')
        setLoading(false)
        return
      }
      const data = (await res.json()) as CourseState
      setCourse(data)
      setLoading(false)
    })()
    return () => {
      cancelled = true
    }
  }, [id])

  const previewModules = useMemo((): PreviewModule[] => {
    if (!course?.modules?.length) return []
    return [...course.modules]
      .sort((a, b) => a.order_index - b.order_index)
      .map((m) => ({
        id: m.id,
        title: m.title,
        order_index: m.order_index,
        content: m.content as PreviewModule['content'],
      }))
  }, [course?.modules])

  async function exportCourseJson() {
    if (!course) return
    setExportingJson(true)
    setExportError(null)
    try {
      const res = await fetch(`/api/courses/${course.id}`)
      const data = (await res.json().catch(() => ({}))) as Record<string, unknown> & { error?: string }
      if (!res.ok) throw new Error(data.error ?? 'Could not export course')
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      const safe =
        course.title
          .replace(/[^\p{L}\p{N}\s-]/gu, '')
          .trim()
          .replace(/\s+/g, '-') || 'course'
      a.download = `${safe}-${course.id.slice(0, 8)}.json`
      a.rel = 'noopener'
      a.click()
      URL.revokeObjectURL(url)
    } catch (e) {
      setExportError(e instanceof Error ? e.message : 'Export failed')
    } finally {
      setExportingJson(false)
    }
  }

  async function togglePublish() {
    if (!course) return
    setPublishing(true)
    setPublishError(null)
    try {
      const method = course.status === 'published' ? 'DELETE' : 'POST'
      const res = await fetch(`/api/courses/${course.id}/publish`, { method })
      const data = (await res.json().catch(() => ({}))) as { error?: string; status?: string }
      if (!res.ok) throw new Error(data.error ?? 'Publish failed')
      const nextStatus = data.status ?? (method === 'POST' ? 'published' : 'draft')
      setCourse((c) => (c ? { ...c, status: nextStatus } : c))
    } catch (e) {
      setPublishError(e instanceof Error ? e.message : 'Publish failed')
    } finally {
      setPublishing(false)
    }
  }

  if (!id) return null
  if (loading) {
    return (
      <div className="mx-auto max-w-3xl space-y-8 p-6" aria-busy="true" aria-label="Loading course">
        <div className="animate-pulse space-y-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="space-y-3">
              <div className="h-8 w-56 rounded-lg bg-slate-800" />
              <div className="h-4 w-40 rounded bg-slate-800/80" />
            </div>
            <div className="h-9 w-28 rounded-lg bg-slate-800" />
          </div>
          <div className="h-40 w-full rounded-xl bg-slate-800/70" />
          <div className="space-y-3">
            <div className="h-4 w-full rounded bg-slate-800/80" />
            <div className="h-4 w-5/6 rounded bg-slate-800/80" />
            <div className="h-4 w-2/3 rounded bg-slate-800/80" />
          </div>
          <div className="space-y-2">
            <div className="h-5 w-32 rounded bg-slate-800" />
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-12 w-full rounded-lg bg-slate-800/60" />
            ))}
          </div>
        </div>
      </div>
    )
  }
  if (error || !course) {
    return (
      <div className="p-8 text-center">
        <p className="text-red-400">{error ?? 'Course not found'}</p>
        <Link href="/courses" className="mt-4 inline-block text-indigo-400 hover:text-indigo-300">
          Back to courses
        </Link>
      </div>
    )
  }

  const hasModules = previewModules.length > 0

  return (
    <div className="mx-auto max-w-[1600px] space-y-8 p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            href="/courses"
            className="rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-white"
            aria-label="Back to courses"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-xl font-semibold text-white">{course.title}</h1>
            <p className="text-xs text-slate-500 capitalize">{course.status}</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => void exportCourseJson()}
            disabled={exportingJson || !course}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-600 px-3 py-2 text-sm text-slate-200 hover:bg-slate-800 disabled:opacity-50"
            aria-label="Download course as JSON"
          >
            {exportingJson ? (
              <SudarInlineLoader size="sm" className="text-slate-300" starFill="var(--background)" />
            ) : (
              <Download className="h-4 w-4 shrink-0" aria-hidden />
            )}
            Export JSON
          </button>
          <CourseExportDialog courseId={course.id} disabled={!hasModules} />
          <button
            type="button"
            onClick={() => void togglePublish()}
            disabled={publishing || !hasModules}
            className={cn(
              'inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors disabled:opacity-50',
              course.status === 'published'
                ? 'border border-slate-600 bg-slate-800 text-slate-200 hover:bg-slate-700'
                : 'bg-emerald-600 text-white hover:bg-emerald-500'
            )}
            aria-label={course.status === 'published' ? 'Unpublish course' : 'Publish course'}
          >
            {publishing ? (
              <SudarInlineLoader size="sm" className="text-white/80" starFill="var(--background)" />
            ) : course.status === 'published' ? (
              <FileText className="h-4 w-4 shrink-0" aria-hidden />
            ) : (
              <Globe className="h-4 w-4 shrink-0" aria-hidden />
            )}
            {course.status === 'published' ? 'Unpublish' : 'Publish'}
          </button>
          <Link
            href={`/courses/${course.id}/preview`}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-600 px-3 py-2 text-sm text-slate-200 hover:bg-slate-800"
          >
            <ExternalLink className="h-4 w-4" aria-hidden />
            Preview
          </Link>
        </div>
      </div>

      {exportError ? (
        <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300" role="alert">
          {exportError}
        </p>
      ) : null}

      {publishError ? (
        <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300" role="alert">
          {publishError}
        </p>
      ) : null}

      {course.description ? <p className="text-sm leading-relaxed text-slate-400">{course.description}</p> : null}

      <CourseStudioWorkspace key={course.id} courseId={course.id} initialModules={previewModules} />

      <CourseAppearancePanel
        courseId={course.id}
        thumbnailUrl={course.thumbnail_url}
        bannerUrl={course.banner_url}
        previewTitle={course.title}
        previewDifficulty={course.difficulty}
        previewDurationMins={course.estimated_duration_mins ?? null}
        previewModuleCount={course.modules?.length ?? null}
        onUrlsChange={(next) => {
          setCourse((c) => (c ? { ...c, ...next } : c))
        }}
      />
    </div>
  )
}

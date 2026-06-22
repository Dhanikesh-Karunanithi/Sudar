'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, BookOpen, Pencil, Phone } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  CourseModuleContent,
  type PreviewCourse,
  type PreviewModule,
} from '@/components/course/CourseModuleContent'
import { ScormExtractedTextEditor } from '@/components/course/ScormExtractedTextEditor'
import { ScormPackageHtmlEditor } from '@/components/course/ScormPackageHtmlEditor'
import { isScormContent } from '@/types/content'

export type { PreviewCourse, PreviewModule }

interface Props {
  course: PreviewCourse
}

export function PreviewCourseView({ course }: Props) {
  const [modules, setModules] = useState<PreviewModule[]>(course.modules)
  const [activeId, setActiveId] = useState<string | null>(course.modules[0]?.id ?? null)

  const activeModule = modules.find((m) => m.id === activeId) ?? modules[0]
  const activeScorm =
    activeModule?.content && isScormContent(activeModule.content) ? activeModule.content : null

  type StudioVideoPhase = 'idle' | 'generating' | 'done' | 'error'
  const [studioVideoPhase, setStudioVideoPhase] = useState<StudioVideoPhase>('idle')
  const [studioVideoPreset, setStudioVideoPreset] = useState<'standard' | 'rich'>('standard')
  const [studioVideoJobId, setStudioVideoJobId] = useState<string | null>(null)
  const [studioVideoEngineMode, setStudioVideoEngineMode] = useState<'classic' | 'premium'>('classic')
  const [studioVideoError, setStudioVideoError] = useState<string | null>(null)
  const [studioRenderGrantReady, setStudioRenderGrantReady] = useState(false)
  const [studioRenderGrantError, setStudioRenderGrantError] = useState(false)

  useEffect(() => {
    setStudioVideoPhase('idle')
    setStudioVideoJobId(null)
    setStudioVideoError(null)
    setStudioRenderGrantReady(false)
    setStudioRenderGrantError(false)
  }, [activeModule?.id])

  async function startStudioWatchVideo() {
    if (!activeModule?.id) return
    setStudioVideoPhase('generating')
    setStudioVideoError(null)

    try {
      const res = await fetch('/api/studio/ai/generate-video', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          course_id: course.id,
          module_id: activeModule.id,
          video_preset: studioVideoPreset,
        }),
      })

      const data = (await res.json().catch(() => ({}))) as {
        error?: string
        job_id?: string
        engine_mode?: 'classic' | 'premium'
      }

      if (!res.ok || !data.job_id) {
        setStudioVideoPhase('error')
        setStudioVideoError(data.error ?? 'Failed to start SudarVid generation.')
        return
      }

      setStudioVideoJobId(data.job_id)
      setStudioVideoEngineMode(data.engine_mode ?? 'classic')
    } catch (err) {
      setStudioVideoPhase('error')
      setStudioVideoError(err instanceof Error ? err.message : 'Failed to reach SudarVid.')
    }
  }

  useEffect(() => {
    if (!studioVideoJobId) return

    let cancelled = false
    async function tick() {
      try {
        const res = await fetch(`/api/studio/ai/generate-video/status/${studioVideoJobId}`)
        const data = (await res.json().catch(() => ({}))) as {
          status?: string
          error?: string
          engine_mode?: 'classic' | 'premium'
        }
        if (!res.ok || !data.status) {
          throw new Error(data.error ?? 'Status fetch failed.')
        }

        if (cancelled) return

        if (data.status === 'done') {
          setStudioVideoPhase('done')
          if (data.engine_mode) setStudioVideoEngineMode(data.engine_mode)
          return
        }
        if (data.status === 'error') {
          setStudioVideoPhase('error')
          setStudioVideoError(data.error ?? 'SudarVid generation failed.')
        }
      } catch (e) {
        if (cancelled) return
        setStudioVideoPhase('error')
        setStudioVideoError(e instanceof Error ? e.message : 'Status polling failed.')
      }
    }

    void tick()
    const interval = window.setInterval(() => void tick(), 2500)
    return () => {
      cancelled = true
      window.clearInterval(interval)
    }
  }, [studioVideoJobId])

  useEffect(() => {
    if (studioVideoPhase !== 'done' || !studioVideoJobId) {
      setStudioRenderGrantReady(false)
      setStudioRenderGrantError(false)
      return
    }
    let cancelled = false
    setStudioRenderGrantReady(false)
    setStudioRenderGrantError(false)
    fetch('/api/studio/ai/generate-video/render-grant', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ job_id: studioVideoJobId }),
    })
      .then((r) => {
        if (!r.ok) throw new Error(String(r.status))
        return r.json()
      })
      .then(() => {
        if (!cancelled) setStudioRenderGrantReady(true)
      })
      .catch(() => {
        if (!cancelled) setStudioRenderGrantError(true)
      })
    return () => {
      cancelled = true
    }
  }, [studioVideoPhase, studioVideoJobId])

  const canGenerateStudioVideo = !activeScorm
  const learnBase =
    (process.env.NEXT_PUBLIC_LEARN_APP_URL ?? 'http://localhost:3001').replace(/\/$/, '')
  const activeSimScenarioId = activeModule?.sim_scenario_id ?? null

  return (
    <div className="flex h-full min-h-0 min-w-0 w-full flex-col bg-background text-foreground overflow-hidden">
      <div
        className="shrink-0 border-b border-amber-500/35 bg-amber-500/10 px-4 py-3 sm:px-6"
        role="region"
        aria-label="Preview mode notice"
      >
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
          <p className="text-sm text-amber-100/95">
            <span className="font-semibold text-amber-50">Read-only preview</span> — this matches what learners see.
            There is no WYSIWYG here. Use the course editor to change content, images, and publish.
          </p>
          <Link
            href={`/courses/${course.id}`}
            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm hover:bg-primary/90"
          >
            <Pencil className="h-4 w-4" aria-hidden />
            Open course editor
          </Link>
        </div>
      </div>
      <div className="flex min-h-0 flex-1 overflow-hidden">
      <aside className="w-64 border-r border-border flex flex-col shrink-0 bg-surface-elevated">
        <div className="p-4 border-b border-border">
          <Link
            href={`/courses/${course.id}`}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground text-sm transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Course editor
          </Link>
        </div>
        <div className="p-3 flex-1 min-h-0 overflow-y-auto">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">Preview</p>
          <p className="text-card-foreground font-medium text-sm truncate" title={course.title}>
            {course.title}
          </p>
          {course.description && (
            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{course.description}</p>
          )}
          <nav className="mt-4 space-y-0.5">
            {modules.map((mod, idx) => (
              <button
                key={mod.id}
                type="button"
                onClick={() => setActiveId(mod.id)}
                className={cn(
                  'w-full text-left px-3 py-2 rounded-lg text-sm transition-colors border border-transparent',
                  activeId === mod.id
                    ? 'bg-primary/15 text-primary border-primary/35'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                )}
              >
                <span className="text-muted-foreground mr-1.5">{idx + 1}.</span>
                {mod.title}
              </button>
            ))}
          </nav>
        </div>
      </aside>
      <main className="flex-1 min-w-0 overflow-y-auto p-8 max-w-3xl">
        {activeModule ? (
          <>
            <h1 className="text-2xl font-bold font-display text-foreground mb-2">{activeModule.title}</h1>
            {activeSimScenarioId ? (
              <div className="mb-6 rounded-xl border border-violet-500/35 bg-violet-500/10 p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm font-semibold text-violet-100 flex items-center gap-2">
                      <Phone className="h-4 w-4" aria-hidden />
                      SudarSim preview
                    </p>
                    <p className="text-xs text-violet-200/90 mt-1">
                      Test the linked scenario in Learn before publishing the course.
                    </p>
                  </div>
                  <a
                    href={`${learnBase}/sim/session/new?scenario_id=${activeSimScenarioId}&module_id=${activeModule.id}&course_id=${course.id}&preview=1`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-violet-500"
                  >
                    Preview simulation
                  </a>
                </div>
              </div>
            ) : null}
            <CourseModuleContent module={activeModule} />
            <div className="mt-6 rounded-xl border border-amber-500/35 bg-amber-500/10 p-4">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-semibold text-amber-50">Watch preview (SudarVid)</p>
                  <p className="text-xs text-amber-100/90">Generate a Standard or Rich lesson video from this module.</p>
                </div>
                <span className="inline-flex rounded-full border border-amber-200/20 px-2 py-0.5 text-[10px] uppercase tracking-wide text-amber-100">
                  {studioVideoEngineMode}
                </span>
              </div>

              <div className="mt-4">
                <div className="grid grid-cols-2 rounded-lg border border-amber-200/20 overflow-hidden bg-amber-950/10">
                  <button
                    type="button"
                    disabled={studioVideoPhase === 'generating' || !canGenerateStudioVideo}
                    onClick={() => setStudioVideoPreset('standard')}
                    className={cn(
                      'px-3 py-2 text-xs font-semibold transition-colors',
                      studioVideoPreset === 'standard'
                        ? 'bg-amber-400 text-amber-950'
                        : 'bg-transparent text-amber-100 hover:bg-amber-400/10',
                      !canGenerateStudioVideo && 'opacity-60 cursor-not-allowed',
                    )}
                  >
                    Standard
                  </button>
                  <button
                    type="button"
                    disabled={studioVideoPhase === 'generating' || !canGenerateStudioVideo}
                    onClick={() => setStudioVideoPreset('rich')}
                    className={cn(
                      'px-3 py-2 text-xs font-semibold transition-colors',
                      studioVideoPreset === 'rich'
                        ? 'bg-amber-400 text-amber-950'
                        : 'bg-transparent text-amber-100 hover:bg-amber-400/10',
                      !canGenerateStudioVideo && 'opacity-60 cursor-not-allowed',
                    )}
                  >
                    Rich lesson
                  </button>
                </div>
              </div>

              {studioVideoPhase === 'idle' && (
                <div className="mt-4">
                  <button
                    type="button"
                    disabled={!canGenerateStudioVideo}
                    onClick={() => void startStudioWatchVideo()}
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-lg bg-amber-300 px-4 py-2.5 text-sm font-semibold text-amber-950 hover:bg-amber-300/90 disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    Generate Watch video
                  </button>
                  {!canGenerateStudioVideo ? (
                    <p className="mt-2 text-xs text-amber-100/90">
                      Watch preview is disabled for SCORM modules in this preview page.
                    </p>
                  ) : (
                    <p className="mt-2 text-xs text-amber-100/90">
                      This takes about 30–60 seconds.
                    </p>
                  )}
                </div>
              )}

              {studioVideoPhase === 'generating' && (
                <div className="mt-4 text-xs text-amber-100/90">Generating with SudarVid…</div>
              )}

              {studioVideoPhase === 'error' && (
                <div className="mt-4 space-y-2">
                  <p className="text-xs text-red-300">{studioVideoError ?? 'Generation failed.'}</p>
                  <button
                    type="button"
                    onClick={() => {
                      setStudioVideoPhase('idle')
                      setStudioVideoJobId(null)
                      setStudioVideoError(null)
                    }}
                    className="text-xs rounded-lg border border-amber-200/20 bg-amber-950/10 px-3 py-2 text-amber-100 hover:bg-amber-400/10"
                  >
                    Try again
                  </button>
                </div>
              )}

              {studioVideoPhase === 'done' && studioVideoJobId && (
                <div className="mt-4 space-y-3">
                  {studioRenderGrantError && (
                    <p className="text-xs text-red-300">
                      Could not authorize the video player. Refresh the page or sign in again.
                    </p>
                  )}
                  {!studioRenderGrantError && !studioRenderGrantReady && (
                    <p className="text-xs text-amber-100/90">Preparing video player…</p>
                  )}
                  {!studioRenderGrantError && studioRenderGrantReady && (
                    <iframe
                      key={studioVideoJobId}
                      src={`/api/studio/ai/generate-video/render/${studioVideoJobId}/slides.html`}
                      className="w-full h-[520px] rounded-xl border border-amber-200/20 bg-black"
                      title="SudarVid Watch preview"
                      allow="autoplay"
                      sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox"
                    />
                  )}
                </div>
              )}
            </div>
            {activeScorm ? (
              <>
                <ScormExtractedTextEditor
                  courseId={course.id}
                  moduleId={activeModule.id}
                  content={activeScorm}
                  onSaved={(next) => {
                    setModules((prev) =>
                      prev.map((m) => (m.id === activeModule.id ? { ...m, content: next } : m))
                    )
                  }}
                />
                <ScormPackageHtmlEditor courseId={course.id} moduleId={activeModule.id} />
              </>
            ) : null}
          </>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
            <BookOpen className="w-12 h-12 opacity-50" />
            <p className="text-sm mt-3">No modules yet. Add modules in the editor.</p>
          </div>
        )}
      </main>
      </div>
    </div>
  )
}

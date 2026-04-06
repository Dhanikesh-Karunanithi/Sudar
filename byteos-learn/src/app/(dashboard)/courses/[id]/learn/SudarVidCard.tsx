'use client'

import { useEffect, useRef, useState } from 'react'
import { Video, Loader2, RotateCcw, Sparkles, AlertCircle, Maximize2, Minimize2 } from 'lucide-react'
import { cn } from '@/lib/utils'

type Phase = 'idle' | 'checking' | 'generating' | 'done' | 'error'

interface Props {
  moduleId: string
  moduleTitle: string
  contentBody: string
  courseId: string
}

const STORAGE_KEY_PREFIX = 'sudar_vid_job_'

function storageKey(moduleId: string) {
  return STORAGE_KEY_PREFIX + moduleId
}

const STEP_LABELS: Record<string, string> = {
  planning: 'Planning slides…',
  images_start: 'Generating images…',
  image_progress: 'Generating images…',
  audio: 'Adding voiceover…',
  rendering: 'Rendering deck…',
  rendering_video: 'Encoding video…',
  done: 'Done!',
}

function friendlyStep(event: string, data?: Record<string, unknown>): string {
  if (event === 'image_progress' && data) {
    const current = typeof data.current === 'number' ? data.current : ''
    const total = typeof data.total === 'number' ? data.total : ''
    if (current && total) return `Generating images ${current} / ${total}…`
  }
  return STEP_LABELS[event] ?? 'Working…'
}

export function SudarVidCard({ moduleId, moduleTitle, contentBody, courseId }: Props) {
  const [phase, setPhase] = useState<Phase>('idle')
  const [jobId, setJobId] = useState<string | null>(null)
  const [progressStep, setProgressStep] = useState('Starting…')
  const [progressPct, setProgressPct] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [fullscreen, setFullscreen] = useState(false)
  const esRef = useRef<EventSource | null>(null)

  // On mount, check localStorage for a previously generated job for this module
  useEffect(() => {
    const cached = localStorage.getItem(storageKey(moduleId))
    if (!cached) return
    setPhase('checking')
    fetch(`/api/ai/generate-video/status/${cached}`)
      .then((r) => r.json())
      .then((data: { status?: string; job_id?: string }) => {
        if (data.status === 'done') {
          setJobId(cached)
          setPhase('done')
        } else if (data.status === 'running' || data.status === 'queued') {
          setJobId(cached)
          setPhase('generating')
          setProgressStep('Resuming…')
          openStream(cached)
        } else {
          // error or missing — clear cache and show idle
          localStorage.removeItem(storageKey(moduleId))
          setPhase('idle')
        }
      })
      .catch(() => {
        localStorage.removeItem(storageKey(moduleId))
        setPhase('idle')
      })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [moduleId])

  // Cleanup SSE on unmount
  useEffect(() => {
    return () => {
      esRef.current?.close()
    }
  }, [])

  function openStream(jId: string) {
    esRef.current?.close()
    const es = new EventSource(`/api/ai/generate-video/stream/${jId}`)
    esRef.current = es

    es.addEventListener('status', (e) => {
      const data = JSON.parse(e.data) as { status: string; step?: string; error?: string }
      if (data.status === 'done') {
        setProgressStep('Done!')
        setProgressPct(100)
        setPhase('done')
        es.close()
      } else if (data.status === 'error') {
        setError(data.error ?? 'Generation failed. Please try again.')
        setPhase('error')
        es.close()
      }
    })

    // Progress step events from SudarVid
    for (const evt of ['planning', 'images_start', 'image_progress', 'audio', 'rendering', 'rendering_video', 'loader_copy']) {
      es.addEventListener(evt, (e) => {
        const data = JSON.parse(e.data) as Record<string, unknown>
        setProgressStep(friendlyStep(evt, data))
        // Rough progress percentages
        const pctMap: Record<string, number> = {
          planning: 10,
          images_start: 20,
          image_progress: 40,
          audio: 65,
          rendering: 85,
          rendering_video: 92,
        }
        if (pctMap[evt]) setProgressPct(pctMap[evt])
      })
    }

    es.onerror = () => {
      // EventSource auto-reconnects; only error out if job is definitively broken
      // Check status once on connection error
      fetch(`/api/ai/generate-video/status/${jId}`)
        .then((r) => r.json())
        .then((data: { status?: string }) => {
          if (data.status === 'done') {
            setProgressStep('Done!')
            setProgressPct(100)
            setPhase('done')
            es.close()
          } else if (data.status === 'error') {
            setError('Generation failed. Please try again.')
            setPhase('error')
            es.close()
          }
        })
        .catch(() => {})
    }
  }

  async function handleGenerate() {
    setPhase('generating')
    setProgressStep('Starting…')
    setProgressPct(5)
    setError(null)

    try {
      const res = await fetch('/api/ai/generate-video', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ module_id: moduleId, course_id: courseId }),
      })
      const data = await res.json() as { job_id?: string; error?: string }
      if (!res.ok || !data.job_id) {
        setError(data.error ?? 'Failed to start video generation.')
        setPhase('error')
        return
      }
      localStorage.setItem(storageKey(moduleId), data.job_id)
      setJobId(data.job_id)
      setProgressStep('Planning slides…')
      setProgressPct(10)
      openStream(data.job_id)
    } catch {
      setError('Could not reach the video generation service. Is SudarVid running?')
      setPhase('error')
    }
  }

  function handleRegenerate() {
    esRef.current?.close()
    localStorage.removeItem(storageKey(moduleId))
    setJobId(null)
    setPhase('idle')
    setError(null)
    setProgressPct(0)
  }

  // ── Idle ──────────────────────────────────────────────────────────────────

  if (phase === 'idle') {
    return (
      <div className="max-w-xl mx-auto py-12 flex flex-col items-center justify-center gap-6 text-center">
        <div className="w-14 h-14 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center">
          <Video className="w-7 h-7 text-primary" />
        </div>
        <div className="space-y-2">
          <p className="text-sm font-semibold text-card-foreground">Generate a video for this module</p>
          <p className="text-xs text-muted-foreground max-w-sm">
            Sudar will create an animated slide deck with narration from this module&apos;s content using Together AI and SudarVid.
            This takes about 30–60 seconds.
          </p>
        </div>
        <button
          type="button"
          onClick={handleGenerate}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold bg-primary text-white shadow-md hover:bg-primary/90 transition-colors"
        >
          <Sparkles className="w-4 h-4" />
          Generate Video
        </button>
        {!contentBody.trim() && (
          <p className="text-xs text-amber-500">This module has no text content — the video will be topic-only.</p>
        )}
      </div>
    )
  }

  // ── Checking (localStorage hit, verifying status) ─────────────────────────

  if (phase === 'checking') {
    return (
      <div className="max-w-xl mx-auto py-12 flex flex-col items-center justify-center gap-4">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
        <p className="text-sm text-muted-foreground">Checking previous video…</p>
      </div>
    )
  }

  // ── Generating ────────────────────────────────────────────────────────────

  if (phase === 'generating') {
    return (
      <div className="max-w-xl mx-auto py-12 flex flex-col items-center justify-center gap-6">
        <div className="w-14 h-14 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center">
          <Loader2 className="w-7 h-7 text-primary animate-spin" />
        </div>
        <div className="w-full space-y-3">
          <p className="text-sm font-medium text-card-foreground text-center">{progressStep}</p>
          <div className="w-full h-2 rounded-full bg-muted overflow-hidden">
            <div
              className="h-full bg-primary rounded-full transition-all duration-700"
              style={{ width: `${progressPct}%` }}
            />
          </div>
          <p className="text-xs text-muted-foreground text-center">
            Generating a slide deck for <span className="font-medium text-card-foreground">{moduleTitle}</span>…
          </p>
        </div>
      </div>
    )
  }

  // ── Error ─────────────────────────────────────────────────────────────────

  if (phase === 'error') {
    return (
      <div className="max-w-xl mx-auto py-12 flex flex-col items-center justify-center gap-4 text-center">
        <AlertCircle className="w-10 h-10 text-destructive" />
        <p className="text-sm text-card-foreground font-medium">Video generation failed</p>
        <p className="text-xs text-muted-foreground max-w-sm">{error}</p>
        <button
          type="button"
          onClick={handleRegenerate}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20 transition-colors"
        >
          <RotateCcw className="w-4 h-4" /> Try again
        </button>
      </div>
    )
  }

  // ── Done — show iframe ────────────────────────────────────────────────────

  return (
    <div className={cn('flex flex-col gap-3', fullscreen && 'fixed inset-0 z-50 bg-background p-4')}>
      <div className="flex items-center justify-between gap-2 shrink-0">
        <p className="text-xs text-muted-foreground">
          Video for <span className="font-medium text-card-foreground">{moduleTitle}</span>
        </p>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setFullscreen((f) => !f)}
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-card-foreground transition-colors"
            aria-label={fullscreen ? 'Exit fullscreen' : 'Fullscreen'}
          >
            {fullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
          <button
            type="button"
            onClick={handleRegenerate}
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors"
          >
            <RotateCcw className="w-3 h-3" /> Regenerate
          </button>
        </div>
      </div>
      <iframe
        src={`/api/ai/generate-video/render/${jobId}/slides.html`}
        className={cn(
          'w-full rounded-xl border border-border bg-black',
          fullscreen ? 'flex-1' : 'h-[580px]'
        )}
        title={`Video: ${moduleTitle}`}
        allow="autoplay"
        sandbox="allow-scripts allow-same-origin"
      />
    </div>
  )
}

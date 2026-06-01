'use client'

import { useEffect, useRef, useState } from 'react'
import { Video, RotateCcw, Sparkles, AlertCircle, Maximize2, Minimize2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { SudarContentCreatingMark, SudarLoadingFrost } from '@/components/branding/SudarPremiumLoader'
import { postLearningEvent } from '@/lib/learn/postLearningEvent'
import { useNotificationSound } from '@/components/features/notifications/NotificationSoundProvider'
import type { SudarVidVideoPreset } from '@/lib/sudarvidPresets'

type Phase = 'idle' | 'checking' | 'generating' | 'done' | 'error'

interface Props {
  moduleId: string
  moduleTitle: string
  contentBody: string
  courseId: string
}

const STORAGE_KEY_PREFIX = 'sudar_vid_job_'
const REGEN_COUNT_KEY_PREFIX = 'sudar_vid_regen_count_'
const REGEN_LIMIT = 2
const RENDER_SCHEMA_VERSION = 'v2'

function storageKey(moduleId: string) {
  return `${STORAGE_KEY_PREFIX}${moduleId}_${RENDER_SCHEMA_VERSION}`
}

type CachedVideoJob = {
  job_id: string
  engine_mode?: 'classic' | 'premium'
  fallback_used?: boolean
  video_preset?: 'standard' | 'rich'
}

function readCachedJob(moduleId: string): CachedVideoJob | null {
  const raw = localStorage.getItem(storageKey(moduleId))
  if (!raw) return null
  try {
    const parsed = JSON.parse(raw) as unknown
    if (parsed && typeof parsed === 'object' && typeof (parsed as { job_id?: unknown }).job_id === 'string') {
      return parsed as CachedVideoJob
    }
  } catch {
    // Backward compatibility: old cache format was just a job id string.
  }
  return { job_id: raw }
}

function regenerateCountKey(moduleId: string) {
  return REGEN_COUNT_KEY_PREFIX + moduleId
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

function parseEventData(raw: string): Record<string, unknown> | null {
  try {
    const parsed = JSON.parse(raw) as unknown
    if (!parsed || typeof parsed !== 'object') return null
    return parsed as Record<string, unknown>
  } catch {
    return null
  }
}

export function SudarVidCard({ moduleId, moduleTitle, contentBody, courseId }: Props) {
  const { playChime } = useNotificationSound()
  const prevPhaseRef = useRef<Phase>('idle')
  const [phase, setPhase] = useState<Phase>('idle')
  const [jobId, setJobId] = useState<string | null>(null)
  const [progressStep, setProgressStep] = useState('Starting…')
  const [progressPct, setProgressPct] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [fullscreen, setFullscreen] = useState(false)
  const [regenerateOpen, setRegenerateOpen] = useState(false)
  const [engineMode, setEngineMode] = useState<'classic' | 'premium'>('classic')
  const [videoPreset, setVideoPreset] = useState<'standard' | 'rich'>('standard')
  const [regenerateReason, setRegenerateReason] = useState('timing-sync')
  const [regenerateGoals, setRegenerateGoals] = useState<string[]>(['audio_caption_match'])
  const [regenerateNotes, setRegenerateNotes] = useState('')
  const [regenerateCount, setRegenerateCount] = useState(0)
  const esRef = useRef<EventSource | null>(null)
  const iframeRef = useRef<HTMLIFrameElement | null>(null)
  const presetFromCacheRef = useRef(false)
  /** Iframe document loads often omit Supabase cookies; we mint an HttpOnly render grant first. */
  const [renderGrantReady, setRenderGrantReady] = useState(false)
  const [renderGrantError, setRenderGrantError] = useState(false)
  const [iframeLoaded, setIframeLoaded] = useState(false)

  function presetToEngineMode(preset: SudarVidVideoPreset): 'classic' | 'premium' {
    return preset === 'rich' || preset === 'rich_mp4' ? 'premium' : 'classic'
  }

  useEffect(() => {
    const prev = prevPhaseRef.current
    if (
      phase === 'done' &&
      prev !== 'done' &&
      (prev === 'generating' || prev === 'checking')
    ) {
      playChime('task_complete')
    }
    prevPhaseRef.current = phase
  }, [phase, playChime])

  // On mount, check localStorage for a previously generated job for this module
  useEffect(() => {
    presetFromCacheRef.current = false
    const attempts = Number(localStorage.getItem(regenerateCountKey(moduleId)) ?? '0')
    setRegenerateCount(Number.isFinite(attempts) ? attempts : 0)
    const cached = readCachedJob(moduleId)
    if (!cached) return

    if (cached.video_preset === 'standard' || cached.video_preset === 'rich') {
      presetFromCacheRef.current = true
      setVideoPreset(cached.video_preset)
    }
    setPhase('checking')
    fetch(`/api/ai/generate-video/status/${cached.job_id}`)
      .then((r) => r.json())
      .then((data: { status?: string; job_id?: string; engine_mode?: 'classic' | 'premium' }) => {
        if (data.status === 'done') {
          setJobId(cached.job_id)
          if (data.engine_mode) setEngineMode(data.engine_mode)
          if (!presetFromCacheRef.current && data.engine_mode) setVideoPreset(data.engine_mode === 'premium' ? 'rich' : 'standard')
          setPhase('done')
        } else if (data.status === 'running' || data.status === 'queued') {
          setJobId(cached.job_id)
          if (data.engine_mode) setEngineMode(data.engine_mode)
          if (!presetFromCacheRef.current && data.engine_mode) setVideoPreset(data.engine_mode === 'premium' ? 'rich' : 'standard')
          setPhase('generating')
          setProgressStep('Resuming…')
          openStream(cached.job_id)
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

  // Load defaults for learner preset selection.
  useEffect(() => {
    let cancelled = false
    fetch('/api/ai/generate-video/options')
      .then((r) => r.json())
      .then((data: { default_video_preset?: string }) => {
        if (cancelled) return
        if (presetFromCacheRef.current) return
        const p = data?.default_video_preset
        if (p === 'standard' || p === 'rich') setVideoPreset(p)
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [moduleId])

  // Cleanup SSE on unmount
  useEffect(() => {
    return () => {
      esRef.current?.close()
    }
  }, [])

  useEffect(() => {
    if (phase !== 'done' || !jobId) {
      setRenderGrantReady(false)
      setRenderGrantError(false)
      setIframeLoaded(false)
      return
    }
    let cancelled = false
    setRenderGrantReady(false)
    setRenderGrantError(false)
    setIframeLoaded(false)
    fetch('/api/ai/generate-video/render-grant', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ job_id: jobId }),
    })
      .then((r) => {
        if (!r.ok) {
          throw new Error(`render-grant failed: ${r.status} ${r.statusText}`)
        }
        return r.json()
      })
      .then(() => {
        if (!cancelled) {
          setRenderGrantReady(true)
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setRenderGrantError(true)
        }
      })
    return () => {
      cancelled = true
    }
  }, [phase, jobId])

  useEffect(() => {
    function handleSudarVidMessage(event: MessageEvent) {
      if (event.origin !== window.location.origin) return
      if (event.source !== iframeRef.current?.contentWindow) return
      const data = event.data as {
        type?: string
        source?: string
        detail?: {
          question?: string
          selected_option?: string
          selected_index?: number
          correct_index?: number
          is_correct?: boolean
          explanation?: string
          event_type?: 'video_play' | 'video_pause' | 'video_replay'
          scene_index?: number
          scene_count?: number
          scene_from?: number
          scene_to?: number
        }
      }
      if (!data?.type || data?.source !== 'sudarvid' || !data.detail) return

      if (data.type === 'sudarvid_telemetry') {
        const eventType = data.detail.event_type
        if (!eventType) return
        postLearningEvent({
          event_type: eventType,
          course_id: courseId,
          module_id: moduleId,
          modality: 'video',
          payload: {
            source: 'sudarvid',
            scene_index: typeof data.detail.scene_index === 'number' ? data.detail.scene_index : null,
            scene_count: typeof data.detail.scene_count === 'number' ? data.detail.scene_count : null,
            scene_from: typeof data.detail.scene_from === 'number' ? data.detail.scene_from : null,
            scene_to: typeof data.detail.scene_to === 'number' ? data.detail.scene_to : null,
          },
        })
        return
      }

      if (data.type !== 'sudarvid_quiz_attempt') return

      const question = String(data.detail.question ?? '').trim()
      const isCorrect = Boolean(data.detail.is_correct)
      postLearningEvent({
        event_type: 'quiz_attempt',
        course_id: courseId,
        module_id: moduleId,
        modality: 'video',
        payload: {
          source: 'sudarvid',
          question,
          selected_option: data.detail.selected_option ?? null,
          selected_index: typeof data.detail.selected_index === 'number' ? data.detail.selected_index : null,
          correct_index: typeof data.detail.correct_index === 'number' ? data.detail.correct_index : null,
          is_correct: isCorrect,
          explanation: data.detail.explanation ?? null,
          score: isCorrect ? 1 : 0,
          wrong_topics: isCorrect || !question ? [] : [question],
        },
      })
    }

    window.addEventListener('message', handleSudarVidMessage)
    
    // Signal iframe readiness to sudarvid
    if (iframeRef.current?.contentWindow) {
      iframeRef.current.contentWindow.postMessage({ type: 'sudarvid_ready' }, window.location.origin)
    }
    
    return () => {
      window.removeEventListener('message', handleSudarVidMessage)
    }
  }, [courseId, moduleId])

  function openStream(jId: string) {
    esRef.current?.close()
    const es = new EventSource(`/api/ai/generate-video/stream/${jId}`)
    esRef.current = es

    es.addEventListener('status', (e) => {
      const data = parseEventData(e.data) as { status?: string; step?: string; error?: string } | null
      if (!data?.status) return
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
        const data = parseEventData(e.data) ?? {}
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

  async function handleGenerate(regenerate?: { reason: string; goals: string[]; notes: string }) {
    setPhase('generating')
    setProgressStep('Starting…')
    setProgressPct(5)
    setError(null)

    try {
      const res = await fetch('/api/ai/generate-video', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          module_id: moduleId,
          course_id: courseId,
          video_preset: videoPreset,
          regenerate,
        }),
      })
      const data = await res.json() as {
        job_id?: string
        error?: string
        engine_mode?: 'classic' | 'premium'
        video_preset?: SudarVidVideoPreset
        fallback_used?: boolean
      }
      if (!res.ok || !data.job_id) {
        setError(data.error ?? 'Failed to start video generation.')
        setPhase('error')
        return
      }
      localStorage.setItem(storageKey(moduleId), JSON.stringify({
        job_id: data.job_id,
        engine_mode: data.engine_mode ?? 'classic',
        video_preset: (data.video_preset === 'rich' || data.video_preset === 'standard') ? data.video_preset : videoPreset,
        fallback_used: Boolean(data.fallback_used),
      }))
      const nextEngineMode = data.engine_mode ?? presetToEngineMode(videoPreset)
      setEngineMode(nextEngineMode)
      if (data.video_preset === 'rich' || data.video_preset === 'standard') setVideoPreset(data.video_preset)
      if (regenerate) {
        const nextCount = Math.min(REGEN_LIMIT, regenerateCount + 1)
        localStorage.setItem(regenerateCountKey(moduleId), String(nextCount))
        setRegenerateCount(nextCount)
      }
      setJobId(data.job_id)
      setProgressStep('Planning slides…')
      setProgressPct(10)
      openStream(data.job_id)
    } catch {
      setError('Could not reach the video generation service. Is SudarVid running?')
      setPhase('error')
    }
  }

  function handleResetCard() {
    esRef.current?.close()
    localStorage.removeItem(storageKey(moduleId))
    setJobId(null)
    setPhase('idle')
    setError(null)
    setProgressPct(0)
  }

  function handleRegenerateClick() {
    if (regenerateCount >= REGEN_LIMIT) return
    setRegenerateOpen(true)
  }

  function toggleGoal(goal: string) {
    setRegenerateGoals((prev) => (
      prev.includes(goal) ? prev.filter((g) => g !== goal) : [...prev, goal]
    ))
  }

  async function submitRegenerate() {
    const goals = regenerateGoals.length ? regenerateGoals : ['audio_caption_match']
    setRegenerateOpen(false)
    handleResetCard()
    await handleGenerate({
      reason: regenerateReason,
      goals,
      notes: regenerateNotes.trim(),
    })
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

        <div className="w-full max-w-md">
          <p className="text-[11px] text-muted-foreground mb-2 text-left">Video format</p>
          <div className="grid grid-cols-2 rounded-xl border border-border overflow-hidden bg-background">
            <button
              type="button"
              onClick={() => setVideoPreset('standard')}
              className={cn(
                'px-3 py-2.5 text-xs font-semibold transition-colors',
                videoPreset === 'standard' ? 'bg-primary text-white' : 'bg-background text-card-foreground hover:bg-muted/30',
              )}
            >
              Standard
            </button>
            <button
              type="button"
              onClick={() => setVideoPreset('rich')}
              className={cn(
                'px-3 py-2.5 text-xs font-semibold transition-colors',
                videoPreset === 'rich' ? 'bg-primary text-white' : 'bg-background text-card-foreground hover:bg-muted/30',
              )}
            >
              Rich lesson
            </button>
          </div>
          <p className="text-[11px] text-muted-foreground mt-2 text-left">
            Standard is faster. Rich lesson includes a more structured mini-course flow with interactions where appropriate.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            void handleGenerate()
          }}
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
      <div className="relative max-w-xl mx-auto min-h-[280px] overflow-hidden rounded-2xl py-12">
        <SudarLoadingFrost layout="block" label="Checking previous video…" className="min-h-[280px]" />
      </div>
    )
  }

  // ── Generating ────────────────────────────────────────────────────────────

  if (phase === 'generating') {
    return (
      <div className="relative max-w-xl mx-auto min-h-[320px] overflow-hidden rounded-2xl py-10">
        <SudarLoadingFrost
          layout="block"
          className="min-h-[320px] gap-6 !justify-start pt-10"
          ariaLabel="Generating your Sudar video"
        >
          <SudarContentCreatingMark className="min-h-0 scale-[0.85] sm:scale-95" />
          <div className="w-full max-w-md space-y-3 px-2">
            <p className="text-sm font-medium text-card-foreground text-center">{progressStep}</p>
            <div className="w-full h-2 rounded-full bg-muted/80 overflow-hidden">
              <div
                className="h-full bg-primary rounded-full transition-all duration-700"
                style={{ width: `${progressPct}%` }}
              />
            </div>
            <p className="text-xs text-muted-foreground text-center">
              Generating a slide deck for <span className="font-medium text-card-foreground">{moduleTitle}</span>…
            </p>
          </div>
        </SudarLoadingFrost>
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
            onClick={handleResetCard}
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
          <span className="ml-2 inline-flex rounded-full border border-border px-2 py-0.5 text-[10px] uppercase tracking-wide">
            {engineMode}
          </span>
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
            onClick={handleRegenerateClick}
            disabled={regenerateCount >= REGEN_LIMIT}
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <RotateCcw className="w-3 h-3" /> Regenerate
          </button>
        </div>
      </div>

      <div className="w-full max-w-md mx-auto">
        <p className="text-[11px] text-muted-foreground mb-2 text-left">Video format</p>
        <div className="grid grid-cols-2 rounded-xl border border-border overflow-hidden bg-background">
          <button
            type="button"
            onClick={() => setVideoPreset('standard')}
            className={cn(
              'px-3 py-2 text-xs font-semibold transition-colors',
              videoPreset === 'standard' ? 'bg-primary text-white' : 'bg-background text-card-foreground hover:bg-muted/30',
            )}
          >
            Standard
          </button>
          <button
            type="button"
            onClick={() => setVideoPreset('rich')}
            className={cn(
              'px-3 py-2 text-xs font-semibold transition-colors',
              videoPreset === 'rich' ? 'bg-primary text-white' : 'bg-background text-card-foreground hover:bg-muted/30',
            )}
          >
            Rich lesson
          </button>
        </div>
      </div>

      {renderGrantError && (
        <div className="rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-center text-xs text-destructive">
          Could not authorize the video player for this session. Try refreshing the page, or sign out and back in.
        </div>
      )}
      {!renderGrantError && !renderGrantReady && (
        <div className="relative w-full rounded-xl border border-border bg-black min-h-[400px] flex items-center justify-center">
          <SudarLoadingFrost layout="block" label="Preparing video player…" className="min-h-[400px]" />
        </div>
      )}
      {!renderGrantError && renderGrantReady && jobId && (
        <div className={cn(
          'relative w-full rounded-xl border border-border bg-black overflow-hidden',
          fullscreen ? 'fixed inset-0 z-50 rounded-none border-none' : 'h-[600px]'
        )}>
          {!iframeLoaded && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-10">
              <div className="text-center space-y-3">
                <div className="inline-flex">
                  <div className="w-3 h-3 bg-primary rounded-full animate-pulse" />
                </div>
                <p className="text-xs text-white/70">Loading video…</p>
              </div>
            </div>
          )}
          <iframe
            ref={iframeRef}
            src={`/api/ai/generate-video/render/${jobId}/slides.html`}
            className="absolute inset-0 w-full h-full"
            title={`Video: ${moduleTitle}`}
            allow="autoplay; accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            sandbox="allow-same-origin allow-scripts allow-popups allow-popups-to-escape-sandbox allow-presentation allow-forms"
            loading="eager"
            onLoad={() => setIframeLoaded(true)}
          />
        </div>
      )}
      <p className="text-[11px] text-muted-foreground">
        Regenerate attempts used: {regenerateCount}/{REGEN_LIMIT}
      </p>
      {regenerateOpen && (
        <div className="fixed inset-0 z-[60] bg-black/50 flex items-center justify-center p-4">
          <div className="w-full max-w-lg rounded-2xl border border-border bg-background p-5 space-y-4">
            <div>
              <p className="text-sm font-semibold text-card-foreground">Refine With Sudar</p>
              <p className="text-xs text-muted-foreground mt-1">
                Choose what should improve before regenerating. You can regenerate up to {REGEN_LIMIT} times.
              </p>
            </div>
            <div className="space-y-2">
              <p className="text-xs font-medium text-card-foreground">Why regenerate?</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                {[
                  { id: 'timing-sync', label: 'Timing / subtitle mismatch' },
                  { id: 'pace', label: 'Pacing feels off' },
                  { id: 'clarity', label: 'Need clearer explanation' },
                  { id: 'style', label: 'Need different visual style' },
                ].map((reason) => (
                  <button
                    key={reason.id}
                    type="button"
                    onClick={() => setRegenerateReason(reason.id)}
                    className={cn(
                      'rounded-lg border px-3 py-2 text-left',
                      regenerateReason === reason.id ? 'border-primary bg-primary/10 text-primary' : 'border-border text-muted-foreground'
                    )}
                  >
                    {reason.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <p className="text-xs font-medium text-card-foreground">What should Sudar focus on?</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                {[
                  { id: 'audio_caption_match', label: 'Stronger audio-caption alignment' },
                  { id: 'smooth_endings', label: 'Smooth ending transitions' },
                  { id: 'engaging_intro_outro', label: 'Better intro/outro feel' },
                  { id: 'timeline_navigation', label: 'Timeline clarity' },
                ].map((goal) => (
                  <button
                    key={goal.id}
                    type="button"
                    onClick={() => toggleGoal(goal.id)}
                    className={cn(
                      'rounded-lg border px-3 py-2 text-left',
                      regenerateGoals.includes(goal.id) ? 'border-primary bg-primary/10 text-primary' : 'border-border text-muted-foreground'
                    )}
                  >
                    {goal.label}
                  </button>
                ))}
              </div>
            </div>
            <textarea
              value={regenerateNotes}
              onChange={(e) => setRegenerateNotes(e.target.value)}
              maxLength={180}
              placeholder="Optional note (short): what would make this video better?"
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-xs text-card-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
              rows={3}
            />
            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setRegenerateOpen(false)}
                className="px-3 py-2 rounded-lg text-xs border border-border text-muted-foreground hover:text-card-foreground"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={submitRegenerate}
                className="px-3 py-2 rounded-lg text-xs bg-primary text-white hover:bg-primary/90"
              >
                Regenerate with Sudar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

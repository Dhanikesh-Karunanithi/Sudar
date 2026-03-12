'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { Volume2, Square, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { splitSentences } from './ReadingBodyWithSentences'

export interface ReadAlongControlsProps {
  /** Plain text content (e.g. from getContentBodyForFlashcards). */
  plainText: string
  courseId: string
  moduleId: string
  /** Notify parent of the current sentence index (e.g. for in-place highlight). */
  onActiveIndexChange?: (index: number) => void
  /** Called when read-along starts (for learning_events). */
  onReadAlongStart?: () => void
  /** Called when read-along completes (for learning_events). */
  onReadAlongComplete?: (durationSecs: number) => void
  /** Show follow-along transcript strip so learner can see which sentence is playing. */
  showFollowAlong?: boolean
  className?: string
}

/**
 * Read aloud: server TTS (Edge-TTS via /api/ai/generate-audio) for human-quality voice.
 * Optional follow-along strip shows sentences and highlights the one being read.
 */
export function ReadAlongControls({
  plainText,
  courseId,
  moduleId,
  onActiveIndexChange,
  onReadAlongStart,
  onReadAlongComplete,
  showFollowAlong = true,
  className,
}: ReadAlongControlsProps) {
  const sentences = splitSentences(plainText.slice(0, 12000))
  const [playing, setPlaying] = useState(false)
  const [loading, setLoading] = useState(false)
  const [activeIndex, setActiveIndex] = useState<number>(-1)
  const [error, setError] = useState<string | null>(null)
  const startTimeRef = useRef<number>(0)
  const sentenceIndexRef = useRef(0)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const objectUrlRef = useRef<string | null>(null)
  const activeSentenceRef = useRef<HTMLSpanElement>(null)

  const hasContent = sentences.length > 0

  const stop = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current.src = ''
    }
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current)
      objectUrlRef.current = null
    }
    sentenceIndexRef.current = 0
    setActiveIndex(-1)
    setError(null)
    onActiveIndexChange?.(-1)
    setPlaying(false)
    setLoading(false)
  }, [onActiveIndexChange])

  useEffect(() => {
    return stop
  }, [stop])

  useEffect(() => {
    if (activeIndex >= 0 && activeSentenceRef.current) {
      activeSentenceRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
    }
  }, [activeIndex])

  const playNext = useCallback(() => {
    if (sentenceIndexRef.current >= sentences.length) {
      const durationSecs = startTimeRef.current ? Math.round((Date.now() - startTimeRef.current) / 1000) : 0
      onReadAlongComplete?.(durationSecs)
      setPlaying(false)
      setLoading(false)
      setActiveIndex(-1)
      onActiveIndexChange?.(-1)
      return
    }
    const idx = sentenceIndexRef.current
    const sentence = sentences[idx]
    setActiveIndex(idx)
    onActiveIndexChange?.(idx)
    setError(null)
    setLoading(true)

    fetch('/api/ai/generate-audio', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: sentence }),
    })
      .then(async (res) => {
        const contentType = (res.headers.get('content-type') || '').toLowerCase()
        if (contentType.includes('application/json')) {
          const data = await res.json()
          if (data.use_browser_tts) {
            setError('Read aloud is unavailable. Server TTS is not configured.')
            setLoading(false)
            setPlaying(false)
            onActiveIndexChange?.(-1)
            return null
          }
          setError(data.error || 'Could not generate audio.')
          setLoading(false)
          setPlaying(false)
          onActiveIndexChange?.(-1)
          return null
        }
        return res.blob()
      })
      .then((blob) => {
        if (!blob || !(blob instanceof Blob)) return
        if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current)
        const url = URL.createObjectURL(blob)
        objectUrlRef.current = url
        setLoading(false)
        const audio = new Audio(url)
        audioRef.current = audio
        audio.onended = () => {
          sentenceIndexRef.current += 1
          playNext()
        }
        audio.onerror = () => {
          sentenceIndexRef.current += 1
          playNext()
        }
        audio.play().catch(() => {
          sentenceIndexRef.current += 1
          playNext()
        })
      })
      .catch(() => {
        setError('Read aloud failed. Please try again.')
        setLoading(false)
        setPlaying(false)
        onActiveIndexChange?.(-1)
      })
  }, [sentences, onReadAlongComplete, onActiveIndexChange])

  const handlePlayPause = () => {
    if (!hasContent) return
    if (playing || loading) {
      stop()
      const durationSecs = startTimeRef.current ? Math.round((Date.now() - startTimeRef.current) / 1000) : 0
      if (durationSecs > 0) onReadAlongComplete?.(durationSecs)
      return
    }
    setError(null)
    startTimeRef.current = Date.now()
    onReadAlongStart?.()
    setPlaying(true)
    sentenceIndexRef.current = 0
    playNext()
  }

  if (!hasContent) return null

  return (
    <div className={cn('flex flex-col gap-2', className)}>
      <div className="flex items-center gap-2 flex-wrap">
        <button
        type="button"
        onClick={handlePlayPause}
        disabled={loading}
        className={cn(
          'flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-all',
          playing || loading
            ? 'bg-amber-100 text-amber-800 border border-amber-200'
            : 'bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20'
        )}
      >
        {loading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : playing ? (
          <Square className="w-4 h-4" />
        ) : (
          <Volume2 className="w-4 h-4" />
        )}
        {loading ? 'Preparing…' : playing ? 'Stop' : 'Read aloud'}
        </button>
        {(playing || loading) && (
          <span className="text-xs text-muted-foreground">
            Sentence {activeIndex + 1} of {sentences.length}
          </span>
        )}
        {error && (
          <span className="text-xs text-destructive" role="alert">
            {error}
          </span>
        )}
      </div>
      {showFollowAlong && sentences.length > 0 && (playing || loading || activeIndex >= 0) && (
        <div
          className="rounded-lg border border-border bg-muted/30 max-h-48 overflow-y-auto p-3 text-sm"
          aria-label="Follow along"
        >
          <p className="text-muted-foreground mb-2 text-xs">Follow along:</p>
          <div className="space-y-1">
            {sentences.map((s, i) => (
              <span
                key={i}
                ref={i === activeIndex ? activeSentenceRef : undefined}
                data-sentence-index={i}
                className={cn(
                  'block transition-colors',
                  i === activeIndex && 'bg-primary/20 text-foreground rounded px-1.5 py-0.5',
                  i < activeIndex && 'text-muted-foreground'
                )}
              >
                {s}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

'use client'

import { Headphones, Loader2, RotateCcw } from 'lucide-react'

export function AudioCard({
  text,
  moduleTitle,
  loading,
  audioUrl,
  audioUnavailable,
  onRetry,
}: {
  text: string
  moduleTitle: string
  loading?: boolean
  audioUrl: string | null
  /** When true, high-quality TTS is not available (Intelligence down or not configured). No browser fallback. */
  audioUnavailable?: boolean
  onRetry?: () => void
}) {
  const plainText = (text || '').trim().slice(0, 12000)
  const hasContent = plainText.length > 0

  if (loading) {
    return (
      <div className="max-w-xl mx-auto py-12 flex flex-col items-center justify-center gap-4">
        <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center animate-pulse">
          <Loader2 className="w-6 h-6 text-primary animate-spin" />
        </div>
        <p className="text-sm text-muted-foreground">Sudar is preparing the audio…</p>
      </div>
    )
  }

  if (!hasContent) {
    return (
      <div className="max-w-xl mx-auto py-12 text-center space-y-3">
        <Headphones className="w-10 h-10 text-muted-foreground mx-auto" />
        <p className="text-sm text-muted-foreground">No text available to listen to for this module.</p>
      </div>
    )
  }

  if (audioUnavailable) {
    return (
      <div className="max-w-xl mx-auto py-12 flex flex-col items-center justify-center gap-4">
        <Headphones className="w-12 h-12 text-muted-foreground" />
        <p className="text-sm text-muted-foreground text-center">Audio is not available right now.</p>
        <p className="text-xs text-muted-foreground text-center max-w-sm">
          Try again later, or use <strong>Read aloud</strong> on the Reading view to hear the content.
        </p>
        {onRetry && (
          <button
            type="button"
            onClick={onRetry}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20 transition-colors"
          >
            <RotateCcw className="w-4 h-4" /> Retry
          </button>
        )}
      </div>
    )
  }

  return (
    <div className="max-w-xl mx-auto py-8 space-y-6">
      <div className="rounded-2xl border border-border bg-card p-6">
        <p className="text-xs font-medium text-muted-foreground mb-2">{moduleTitle}</p>
        <audio
          controls
          src={audioUrl ?? undefined}
          className="w-full mt-2"
        />
        {onRetry && (
          <div className="mt-3">
            <button
              type="button"
              onClick={onRetry}
              className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary"
            >
              <RotateCcw className="w-3 h-3" /> Regenerate audio
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

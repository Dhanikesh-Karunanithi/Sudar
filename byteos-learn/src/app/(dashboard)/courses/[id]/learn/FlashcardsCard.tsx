'use client'

import { useState } from 'react'
import { ChevronLeft, ChevronRight, RotateCcw, Layers } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface FlashcardPair {
  front: string
  back: string
}

export function FlashcardsCard({
  cards,
  loading,
  onRetry,
}: {
  cards: FlashcardPair[]
  loading?: boolean
  onRetry?: () => void
}) {
  const [index, setIndex] = useState(0)
  const [flipped, setFlipped] = useState(false)

  if (loading) {
    return (
      <div className="max-w-xl mx-auto py-12 flex flex-col items-center justify-center gap-4">
        <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center animate-pulse">
          <Layers className="w-6 h-6 text-primary" />
        </div>
        <p className="text-sm text-muted-foreground">Sudar is building your flashcards…</p>
      </div>
    )
  }

  if (!cards.length) {
    return (
      <div className="max-w-xl mx-auto py-12 text-center space-y-3">
        <Layers className="w-10 h-10 text-muted-foreground mx-auto" />
        <p className="text-sm text-muted-foreground">No flashcards could be generated for this module.</p>
        {onRetry && (
          <button onClick={onRetry} className="text-xs text-primary hover:underline">
            Try again
          </button>
        )}
      </div>
    )
  }

  const card = cards[index]
  const canPrev = index > 0
  const canNext = index < cards.length - 1

  return (
    <div className="max-w-xl mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs text-muted-foreground">
          Card {index + 1} of {cards.length}
        </span>
        {onRetry && (
          <button onClick={onRetry} className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1">
            <RotateCcw className="w-3 h-3" /> Regenerate
          </button>
        )}
      </div>

      <button
        type="button"
        onClick={() => setFlipped((f) => !f)}
        className="w-full min-h-[200px] rounded-2xl border-2 border-border bg-card shadow-lg p-6 text-left transition-all duration-200 hover:border-primary/30 hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-primary/20"
      >
        {!flipped ? (
          <div className="space-y-2">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">Front — tap to flip</p>
            <p className="text-base font-medium text-card-foreground leading-snug whitespace-pre-wrap">{card.front}</p>
          </div>
        ) : (
          <div className="space-y-2">
            <p className="text-[10px] uppercase tracking-wider text-primary font-medium">Back — tap to flip</p>
            <p className="text-sm text-card-foreground leading-relaxed whitespace-pre-wrap">{card.back}</p>
          </div>
        )}
      </button>

      <div className="flex items-center justify-between gap-4">
        <button
          onClick={() => { setIndex((i) => i - 1); setFlipped(false) }}
          disabled={!canPrev}
          className={cn(
            'flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium transition-colors',
            canPrev ? 'bg-muted hover:bg-muted/80 text-card-foreground' : 'bg-muted/50 text-muted-foreground cursor-not-allowed'
          )}
        >
          <ChevronLeft className="w-4 h-4" /> Previous
        </button>
        <button
          onClick={() => { setIndex((i) => i + 1); setFlipped(false) }}
          disabled={!canNext}
          className={cn(
            'flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium transition-colors',
            canNext ? 'bg-primary text-white hover:bg-primary/90' : 'bg-muted/50 text-muted-foreground cursor-not-allowed'
          )}
        >
          Next <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}

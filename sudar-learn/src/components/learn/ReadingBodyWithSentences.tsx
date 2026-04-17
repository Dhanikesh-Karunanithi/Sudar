'use client'

import { useEffect, useRef } from 'react'
import { cn } from '@/lib/utils'

/** Split plain text into sentences. */
function splitSentences(text: string): string[] {
  const trimmed = (text || '').trim()
  if (!trimmed) return []
  const parts = trimmed
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter(Boolean)
  return parts.length > 0 ? parts : [trimmed]
}

/** Group text into paragraphs (by double newline), then each paragraph into sentences with global indices. */
function paragraphAndSentences(plainText: string): { text: string; globalIndex: number }[][] {
  const trimmed = (plainText || '').trim()
  if (!trimmed) return []
  const paragraphs = trimmed.split(/\n\n+/).map((p) => p.trim()).filter(Boolean)
  const result: { text: string; globalIndex: number }[][] = []
  let globalIndex = 0
  for (const para of paragraphs) {
    const sentences = splitSentences(para)
    result.push(sentences.map((text) => ({ text, globalIndex: globalIndex++ })))
  }
  return result
}

export interface ReadingBodyWithSentencesProps {
  /** Plain text content (e.g. from getContentBodyForFlashcards). */
  plainText: string
  /** Index of the sentence to highlight (e.g. current read-along position). -1 = none. */
  activeSentenceIndex: number
  className?: string
}

/**
 * Renders body text as paragraphs with sentence spans so the active sentence can be highlighted in place.
 * Use with ReadAlongControls: pass activeSentenceIndex to highlight the phrase being read.
 */
export function ReadingBodyWithSentences({
  plainText,
  activeSentenceIndex,
  className,
}: ReadingBodyWithSentencesProps) {
  const activeRef = useRef<HTMLSpanElement>(null)
  const limited = plainText.slice(0, 12000)
  const groups = paragraphAndSentences(limited)

  useEffect(() => {
    if (activeSentenceIndex >= 0 && activeRef.current) {
      activeRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  }, [activeSentenceIndex])

  if (groups.length === 0) return null

  return (
    <div className={cn('space-y-4', className)}>
      {groups.map((para, pi) => (
        <p key={pi} className="text-card-foreground text-sm leading-relaxed">
          {para.map(({ text, globalIndex }, idxInPara) => (
            <span
              key={globalIndex}
              ref={globalIndex === activeSentenceIndex ? activeRef : undefined}
              data-sentence-index={globalIndex}
              className={cn(
                globalIndex === activeSentenceIndex && 'bg-primary/20 rounded px-0.5 transition-colors',
                globalIndex < activeSentenceIndex && 'text-muted-foreground'
              )}
            >
              {text}
              {idxInPara < para.length - 1 ? ' ' : ''}
            </span>
          ))}
        </p>
      ))}
    </div>
  )
}

export { splitSentences }

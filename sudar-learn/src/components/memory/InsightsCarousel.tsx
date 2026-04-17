'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import type { Insight } from '@/types/memory'
import { cn } from '@/lib/utils'

const CAROUSEL_SHIFT_X = '18vw'
const SUMMARY_MAX_LENGTH = 140

function getSummary(description: string): string {
  if (description.length <= SUMMARY_MAX_LENGTH) return description
  const trimmed = description.slice(0, SUMMARY_MAX_LENGTH).trim()
  const lastSpace = trimmed.lastIndexOf(' ')
  const cut = lastSpace > 50 ? trimmed.slice(0, lastSpace) : trimmed
  return cut + '…'
}

export function InsightsCarousel({ insights }: { insights: Insight[] }) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [expandedInsight, setExpandedInsight] = useState<Insight | null>(null)
  const stageRef = useRef<HTMLDivElement>(null)

  const len = insights.length
  const next = useCallback(() => {
    setCurrentIndex((i) => (i + 1) % len)
  }, [len])
  const prev = useCallback(() => {
    setCurrentIndex((i) => (i - 1 + len) % len)
  }, [len])

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (expandedInsight) {
        if (e.key === 'Escape') setExpandedInsight(null)
        return
      }
      if (e.key === 'ArrowRight') next()
      if (e.key === 'ArrowLeft') prev()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [next, prev, expandedInsight])

  if (len === 0) return null

  return (
    <>
      <div
        className="flex flex-col items-center justify-center overflow-hidden py-4"
        style={{ perspective: 2000 }}
      >
        <div
          ref={stageRef}
          className="relative w-full flex items-center justify-center"
          style={{
            minHeight: 280,
            transformStyle: 'preserve-3d',
          }}
        >
          {insights.map((insight, i) => {
            const half = Math.floor(len / 2)
            let relativeOffset = ((i - currentIndex + len) % len)
            if (relativeOffset > half) relativeOffset -= len

            const positionClass =
              relativeOffset === 0
                ? 'active'
                : relativeOffset === -1
                  ? 'left'
                  : relativeOffset === 1
                    ? 'right'
                    : relativeOffset <= -2
                      ? 'farLeft'
                      : relativeOffset >= 2
                        ? 'farRight'
                        : 'hidden'

            const isActive = positionClass === 'active'
            const summary = getSummary(insight.description)

            return (
              <div
                key={insight.id}
                className={cn(
                  'carousel-card absolute rounded-card-lg border border-border overflow-hidden transition-all duration-[800ms] ease-[cubic-bezier(0.2,0.8,0.2,1)]',
                  'bg-card/90 backdrop-blur-xl',
                  isActive && 'cursor-pointer hover:shadow-lg z-10 opacity-100 shadow-md',
                  positionClass === 'left' && 'z-[5] opacity-50 cursor-default',
                  positionClass === 'right' && 'z-[5] opacity-50 cursor-default',
                  positionClass === 'farLeft' && 'z-[1] opacity-20',
                  positionClass === 'farRight' && 'z-[1] opacity-20',
                  positionClass === 'hidden' && 'opacity-0 pointer-events-none z-0'
                )}
                style={getCardStyle(positionClass)}
                aria-hidden={!isActive}
                role="group"
                aria-roledescription="slide"
                aria-label={`Insight ${currentIndex + 1} of ${len}`}
                onClick={() => isActive && setExpandedInsight(insight)}
              >
                <div
                  className={cn(
                    'w-full h-[120px] rounded-t-card flex-shrink-0',
                    insight.pattern && `insight-pattern ${insight.pattern}`
                  )}
                />
                <div className="card-content px-4 py-3 flex flex-col flex-grow bg-gradient-to-b from-transparent to-black/20 dark:to-black/40 min-h-[140px]">
                  <div className="flex justify-between items-center gap-2 mb-1">
                    <h3 className="text-sm font-semibold text-card-foreground m-0 line-clamp-1">
                      {insight.title}
                    </h3>
                    <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded bg-muted/80 text-muted-foreground shrink-0">
                      {insight.tag}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground italic line-clamp-3 flex-grow leading-relaxed">
                    {summary}
                  </p>
                  <div className="flex items-center justify-between gap-1.5 mt-1">
                    {insight.updatedAt && (
                      <span className="text-[10px] text-muted-foreground">
                        {new Date(insight.updatedAt).toLocaleDateString(undefined, { dateStyle: 'short' })}
                      </span>
                    )}
                    {isActive && (
                      <span className="text-[10px] font-medium text-primary shrink-0">
                        View details →
                      </span>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        <div className="mt-4 flex items-center gap-3 liquid-glass px-5 py-2.5 rounded-full min-w-fit max-w-[90vw]">
          <button
            type="button"
            onClick={prev}
            className="p-1.5 text-xl text-card-foreground hover:bg-muted rounded-button transition-colors focus:outline-none focus:ring-2 focus:ring-primary"
            aria-label="Previous insight"
          >
            ‹
          </button>
          <div
            className="flex gap-1.5 items-center px-3 border-x border-border"
            role="tablist"
            aria-label="Insight slides"
          >
            {insights.map((_, i) => (
              <button
                key={i}
                type="button"
                role="tab"
                aria-selected={i === currentIndex}
                aria-label={`Go to insight ${i + 1}`}
                className={cn(
                  'rounded-full cursor-pointer transition-all duration-300',
                  i === currentIndex
                    ? 'w-4 h-1 bg-primary rounded-[10px]'
                    : 'w-1 h-1 bg-muted-foreground/30 hover:bg-muted-foreground/60 hover:scale-125'
                )}
                onClick={(e) => {
                  e.stopPropagation()
                  setCurrentIndex(i)
                }}
              />
            ))}
          </div>
          <button
            type="button"
            onClick={next}
            className="p-1.5 text-xl text-card-foreground hover:bg-muted rounded-button transition-colors focus:outline-none focus:ring-2 focus:ring-primary"
            aria-label="Next insight"
          >
            ›
          </button>
        </div>
      </div>

      {/* Expanded detail modal */}
      {expandedInsight && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
          aria-modal="true"
          role="dialog"
          aria-labelledby="insight-detail-title"
          onClick={() => setExpandedInsight(null)}
        >
          <div
            className={cn(
              'bg-card border border-border rounded-card-xl shadow-xl max-w-md w-full max-h-[85vh] overflow-hidden flex flex-col',
              'insight-detail-panel'
            )}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              className={cn(
                'w-full h-24 flex-shrink-0',
                expandedInsight.pattern && `insight-pattern ${expandedInsight.pattern}`
              )}
            />
            <div className="p-5 flex flex-col flex-grow overflow-auto">
              <div className="flex justify-between items-start gap-3 mb-2">
                <h2 id="insight-detail-title" className="text-lg font-semibold text-card-foreground m-0 pr-2">
                  {expandedInsight.title}
                </h2>
                <span className="text-xs uppercase tracking-wider px-2.5 py-1 rounded bg-muted text-muted-foreground shrink-0">
                  {expandedInsight.tag}
                </span>
              </div>
              <p className="text-sm text-muted-foreground italic leading-relaxed mb-4">
                {expandedInsight.description}
              </p>
              {expandedInsight.updatedAt && (
                <p className="text-xs text-muted-foreground mb-4">
                  Updated {new Date(expandedInsight.updatedAt).toLocaleDateString(undefined, { dateStyle: 'medium' })}
                </p>
              )}
              <div className="flex flex-wrap gap-2 mt-auto pt-2">
                {expandedInsight.ctaHref && expandedInsight.ctaLabel && (
                  <Link
                    href={expandedInsight.ctaHref}
                    className="inline-flex items-center justify-center px-4 py-2.5 rounded-button bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity"
                  >
                    {expandedInsight.ctaLabel} →
                  </Link>
                )}
                <button
                  type="button"
                  onClick={() => setExpandedInsight(null)}
                  className="inline-flex items-center justify-center px-4 py-2.5 rounded-button border border-border bg-card text-card-foreground text-sm font-medium hover:bg-muted transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

function getCardStyle(position: string): React.CSSProperties {
  const shiftX = CAROUSEL_SHIFT_X
  const width = 'clamp(200px, 18vw, 280px)'
  const height = 'clamp(280px, 38vh, 340px)'
  switch (position) {
    case 'active':
      return {
        transform: 'translate3d(0, 0, 120px) rotateY(0deg)',
        width,
        height,
      }
    case 'left':
      return {
        transform: `translate3d(calc(${shiftX} * -1), 0, -80px) rotateY(35deg) scale(0.85)`,
        width,
        height,
      }
    case 'right':
      return {
        transform: `translate3d(${shiftX}, 0, -80px) rotateY(-35deg) scale(0.85)`,
        width,
        height,
      }
    case 'farLeft':
      return {
        transform: `translate3d(calc(${shiftX} * -1.8), 0, -240px) rotateY(45deg) scale(0.6)`,
        width,
        height,
      }
    case 'farRight':
      return {
        transform: `translate3d(calc(${shiftX} * 1.8), 0, -240px) rotateY(-45deg) scale(0.6)`,
        width,
        height,
      }
    case 'hidden':
    default:
      return {
        transform: 'translate3d(0, 0, -1000px) scale(0.1)',
        width,
        height,
      }
  }
}

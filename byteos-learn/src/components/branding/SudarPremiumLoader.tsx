'use client'

import { useEffect, useId, useState, type ReactNode } from 'react'
import { useReducedMotion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { SudarLogoMark } from '@/components/branding/SudarLogo'

/** Matches HTML prototype cycle so draw + entrance replay cleanly */
export const SUDAR_PREMIUM_CYCLE_MS = 5400

export function SudarPremiumMark({ className }: { className?: string }) {
  const uid = useId().replace(/:/g, '')
  const reduceMotion = useReducedMotion()
  const [cycle, setCycle] = useState(0)

  useEffect(() => {
    if (reduceMotion) return
    const t = window.setInterval(() => setCycle((c) => c + 1), SUDAR_PREMIUM_CYCLE_MS)
    return () => window.clearInterval(t)
  }, [reduceMotion])

  if (reduceMotion) {
    return (
      <div className={cn('flex items-center justify-center', className)} aria-hidden>
        <SudarLogoMark className="h-16 w-auto text-primary" motion="none" />
      </div>
    )
  }

  return (
    <div className={cn('sudar-premium-root flex items-center justify-center', className)} aria-hidden>
      <div key={cycle} className="sudar-premium-wrapper">
        <div className="sudar-premium-scene">
          <svg className="sudar-premium-svg" viewBox="0 0 360 220" xmlns="http://www.w3.org/2000/svg">
            <line className="sudar-premium-guide" x1="0" y1="100" x2="360" y2="100" />
            <path
              className="sudar-premium-stroke-a"
              d="M147,36 L253,36 C270.673,36 285,50.327 285,68 C285,85.673 270.673,100 253,100 L147,100 C129.327,100 115,85.673 115,68 C115,50.327 129.327,36 147,36"
            />
            <path
              className="sudar-premium-stroke-b"
              d="M107,100 L213,100 C230.673,100 245,114.327 245,132 C245,149.673 230.673,164 213,164 L107,164 C89.327,164 75,149.673 75,132 C75,114.327 89.327,100 107,100"
            />
          </svg>
          <div className="sudar-premium-pill sudar-premium-pill--top" />
          <div className="sudar-premium-star">
            <svg width="90" height="90" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <linearGradient id={`${uid}-star-grad`} x1="20%" y1="10%" x2="80%" y2="90%">
                  <stop offset="0%" stopColor="rgba(255,255,255,0.95)" />
                  <stop offset="40%" stopColor="rgba(220,228,255,0.85)" />
                  <stop offset="100%" stopColor="rgba(190,205,255,0.75)" />
                </linearGradient>
                <radialGradient id={`${uid}-star-glow`} cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="rgba(255,255,255,0.9)" />
                  <stop offset="55%" stopColor="rgba(210,220,255,0.5)" />
                  <stop offset="100%" stopColor="rgba(180,200,255,0)" />
                </radialGradient>
              </defs>
              <path
                d="M50,2 C51,49,51,49,98,50 C51,51,51,51,50,98 C49,51,49,51,2,50 C49,49,49,49,50,2 Z"
                fill={`url(#${uid}-star-glow)`}
                opacity="0.6"
              />
              <path
                d="M50,2 C51,49,51,49,98,50 C51,51,51,51,50,98 C49,51,49,51,2,50 C49,49,49,49,50,2 Z"
                fill={`url(#${uid}-star-grad)`}
              />
            </svg>
          </div>
          <div className="sudar-premium-pill sudar-premium-pill--bottom" />
        </div>
      </div>
    </div>
  )
}

type FrostProps = {
  label?: string
  /** Accessible name when `label` is omitted (avoids duplicate visible copy) */
  ariaLabel?: string
  /** `fixed` covers the viewport; `section` fills a positioned parent */
  variant?: 'section' | 'fixed'
  /** `overlay` = absolute/fixed fill; `block` = in-flow panel (e.g. modality cards) */
  layout?: 'overlay' | 'block'
  className?: string
  /** Override center mark (default: SudarPremiumMark) */
  children?: ReactNode
}

export function SudarLoadingFrost({
  label,
  ariaLabel,
  variant = 'section',
  layout = 'overlay',
  className,
  children,
}: FrostProps) {
  const position =
    layout === 'block'
      ? 'relative z-20 w-full min-h-[inherit]'
      : variant === 'fixed'
        ? 'fixed inset-0 z-[100]'
        : 'absolute inset-0 z-20'

  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center gap-4 p-6 sm:p-8',
        position,
        'rounded-[inherit]',
        'bg-background/40 dark:bg-background/50',
        'backdrop-blur-xl backdrop-saturate-150',
        'border border-border/25 shadow-sm',
        className
      )}
      role="status"
      aria-live="polite"
      aria-busy="true"
      aria-label={ariaLabel ?? label ?? 'Loading'}
    >
      {children ?? <SudarPremiumMark />}
      {label ? (
        <p className="text-sm font-medium text-muted-foreground text-center max-w-xs">{label}</p>
      ) : null}
    </div>
  )
}

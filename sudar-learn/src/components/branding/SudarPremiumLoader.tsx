'use client'

import { useEffect, useId, useState, type ReactNode, type RefObject } from 'react'
import { useReducedMotion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { SudarLogoMark } from '@/components/branding/SudarLogo'

const MICRO_STAR_PATH =
  'M 50 2 C 51 49, 51 49, 98 50 C 51 51, 51 51, 50 98 C 49 51, 49 51, 2 50 C 49 49, 49 49, 50 2 Z'

/** Viewport size (px) — must be fixed so scaled 360×220 scene does not expand flex layout */
const MICRO_VIEW: Record<'sm' | 'md' | 'lg', { w: number; h: number; scale: number }> = {
  sm: { w: 22, h: 14, scale: 0.063 },
  md: { w: 28, h: 18, scale: 0.08 },
  lg: { w: 34, h: 22, scale: 0.097 },
}

/** Subtle pill + star animation for buttons (simple_loading_sudar.html) */
export function SudarMicroMark({
  className,
  starFill = 'var(--background)',
  size = 'sm',
}: {
  className?: string
  starFill?: string
  size?: 'sm' | 'md' | 'lg'
}) {
  const reduceMotion = useReducedMotion()
  const dim = size === 'lg' ? 'h-6 w-auto' : size === 'md' ? 'h-5 w-auto' : 'h-4 w-auto'
  const v = MICRO_VIEW[size]

  if (reduceMotion) {
    return (
      <SudarLogoMark
        className={cn(dim, 'shrink-0 text-primary', className)}
        starFill={starFill}
        motion="none"
        aria-hidden
      />
    )
  }

  return (
    <div
      className="relative inline-flex shrink-0 items-center justify-center overflow-hidden"
      style={{
        width: v.w,
        height: v.h,
        minWidth: v.w,
        minHeight: v.h,
        maxWidth: v.w,
        maxHeight: v.h,
      }}
      aria-hidden
    >
      <div
        className="sudar-micro-root pointer-events-none absolute left-1/2 top-1/2"
        style={{
          transform: `translate(-50%, -50%) scale(${v.scale})`,
          transformOrigin: 'center center',
        }}
      >
        <div className={cn('sudar-micro-scene', className)}>
          <div className="sudar-micro-pill sudar-micro-pill--top bg-current" />
          <div className="sudar-micro-pill sudar-micro-pill--bottom bg-current" />
          <div className="sudar-micro-star">
            <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
              <path d={MICRO_STAR_PATH} fill={starFill} />
            </svg>
          </div>
        </div>
      </div>
    </div>
  )
}

function CcChipSvg({ variant }: { variant: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 }) {
  const stroke = 'currentColor'
  switch (variant) {
    case 1:
      return (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 19l7-7 3 3-7 7-3-3z" />
          <path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z" />
          <circle cx="11" cy="11" r="2" />
        </svg>
      )
    case 2:
      return (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="3" width="7" height="7" rx="1" />
          <circle cx="17.5" cy="6.5" r="3.5" />
          <path d="M3 21l4.5-7 3.5 5 2.5-3.5L17 21H3z" />
        </svg>
      )
    case 3:
      return (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <circle cx="8" cy="10" r="1.2" fill="currentColor" stroke="none" />
          <circle cx="12" cy="7" r="1.2" fill="currentColor" stroke="none" />
          <circle cx="16" cy="10" r="1.2" fill="currentColor" stroke="none" />
          <circle cx="17" cy="15" r="2" fill="currentColor" stroke="none" />
        </svg>
      )
    case 4:
      return (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="3" width="7" height="7" rx="1" />
          <rect x="14" y="3" width="7" height="7" rx="1" />
          <rect x="3" y="14" width="7" height="7" rx="1" />
          <rect x="14" y="14" width="7" height="7" rx="1" />
        </svg>
      )
    case 5:
      return (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="4 7 4 4 20 4 20 7" />
          <line x1="9" y1="20" x2="15" y2="20" />
          <line x1="12" y1="4" x2="12" y2="20" />
        </svg>
      )
    case 6:
      return (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="2" y="4" width="20" height="13" rx="2" />
          <line x1="5" y1="8" x2="19" y2="8" />
          <line x1="5" y1="11" x2="13" y2="11" />
          <line x1="5" y1="14" x2="10" y2="14" />
          <line x1="12" y1="21" x2="12" y2="17" />
        </svg>
      )
    case 7:
      return (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="9" y1="6" x2="20" y2="6" />
          <line x1="9" y1="12" x2="20" y2="12" />
          <line x1="9" y1="18" x2="20" y2="18" />
          <circle cx="4.5" cy="6" r="1.5" fill="currentColor" stroke="none" />
          <circle cx="4.5" cy="12" r="1.5" fill="currentColor" stroke="none" />
          <circle cx="4.5" cy="18" r="1.5" fill="currentColor" stroke="none" />
        </svg>
      )
    default:
      return (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polygon points="12 2 22 8.5 12 15 2 8.5 12 2" />
          <polyline points="2 13.5 12 20 22 13.5" />
        </svg>
      )
  }
}

const CC_INNER_POS = ['sudar-cc-orb-inner-1', 'sudar-cc-orb-inner-2', 'sudar-cc-orb-inner-3', 'sudar-cc-orb-inner-4'] as const
const CC_OUTER_POS = ['sudar-cc-orb-outer-1', 'sudar-cc-orb-outer-2', 'sudar-cc-orb-outer-3', 'sudar-cc-orb-outer-4'] as const

/** Orbit + chips while Sudar generates learning content */
export function SudarContentCreatingMark({ className }: { className?: string }) {
  const reduceMotion = useReducedMotion()
  if (reduceMotion) {
    return (
      <div className={cn('flex items-center justify-center', className)} aria-hidden>
        <SudarLogoMark className="h-16 w-auto text-primary" motion="none" />
      </div>
    )
  }

  return (
    <div className={cn('flex items-center justify-center', className)} aria-hidden>
      <div className="sudar-cc-stage">
        <div className="sudar-cc-orbit-ring sudar-cc-orbit-ring--1" />
        <div className="sudar-cc-orbit-ring sudar-cc-orbit-ring--2" />
        <div className="sudar-cc-inner-orbit">
          {([1, 2, 3, 4] as const).map((v, i) => (
            <div key={v} className={cn('sudar-cc-orb-item', CC_INNER_POS[i])}>
              <div className="sudar-cc-chip">
                <CcChipSvg variant={v} />
              </div>
            </div>
          ))}
        </div>
        <div className="sudar-cc-outer-orbit">
          {([5, 6, 7, 8] as const).map((v, i) => (
            <div key={v} className={cn('sudar-cc-orb-item', CC_OUTER_POS[i])}>
              <div className="sudar-cc-chip">
                <CcChipSvg variant={v} />
              </div>
            </div>
          ))}
        </div>
        <div className="sudar-cc-logo-center">
          <svg viewBox="0 0 210 128" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="0" y="64" width="170" height="64" rx="32" className="fill-foreground" />
            <rect x="40" y="0" width="170" height="64" rx="32" className="fill-foreground" />
            <path
              className="sudar-cc-star-glow fill-background"
              transform="translate(60, 19) scale(0.9)"
              d="M 50 2 C 51 49, 51 49, 98 50 C 51 51, 51 51, 50 98 C 49 51, 49 51, 2 50 C 49 49, 49 49, 50 2 Z"
            />
          </svg>
        </div>
      </div>
    </div>
  )
}

const FP_STREAKS: { cls: string; y: number; x2: number; sw: number }[] = [
  { cls: 'sudar-fp-s1', y: 42, x2: 300, sw: 1.5 },
  { cls: 'sudar-fp-s2', y: 90, x2: 180, sw: 1 },
  { cls: 'sudar-fp-s3', y: 130, x2: 380, sw: 2 },
  { cls: 'sudar-fp-s4', y: 168, x2: 140, sw: 1 },
  { cls: 'sudar-fp-s5', y: 210, x2: 420, sw: 2.5 },
  { cls: 'sudar-fp-s6', y: 248, x2: 200, sw: 1 },
  { cls: 'sudar-fp-s7', y: 278, x2: 340, sw: 1.5 },
  { cls: 'sudar-fp-s8', y: 305, x2: 160, sw: 1 },
  { cls: 'sudar-fp-s9', y: 328, x2: 390, sw: 2 },
  { cls: 'sudar-fp-s10', y: 358, x2: 220, sw: 1 },
  { cls: 'sudar-fp-s11', y: 390, x2: 310, sw: 1.5 },
  { cls: 'sudar-fp-s12', y: 425, x2: 170, sw: 1 },
  { cls: 'sudar-fp-s13', y: 460, x2: 360, sw: 2 },
  { cls: 'sudar-fp-s14', y: 500, x2: 130, sw: 1 },
  { cls: 'sudar-fp-s15', y: 535, x2: 280, sw: 1.5 },
  { cls: 'sudar-fp-s16', y: 572, x2: 190, sw: 1 },
]

function FpHyperLogoScene({ className }: { className?: string }) {
  return (
    <div className={cn('sudar-fp-hyper-logo', className)}>
      <div className="sudar-fp-pill sudar-fp-pill--top" />
      <div className="sudar-fp-pill sudar-fp-pill--bottom" />
      <div className="sudar-fp-star">
        <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
          <path d={MICRO_STAR_PATH} className="fill-background" />
        </svg>
      </div>
    </div>
  )
}

/** Warp / speed-streak full-viewport hero loader — continuous hyperdrive or exit zap */
export function SudarFullpageMark({
  className,
  phase = 'warp',
  mainRef,
}: {
  className?: string
  /** `warp` = continuous L→R cruise while loading; `exit` = zap off-screen right when done */
  phase?: 'warp' | 'exit'
  mainRef?: RefObject<HTMLDivElement | null>
}) {
  const reduceMotion = useReducedMotion()
  if (reduceMotion) {
    return (
      <div className={cn('flex items-center justify-center', className)} aria-hidden>
        <SudarLogoMark className="h-20 w-auto text-primary" motion="none" />
      </div>
    )
  }

  const phaseClass = phase === 'exit' ? 'sudar-fp-hyper-root--exit' : 'sudar-fp-hyper-root--warp'

  return (
    <div className={cn('sudar-fp-hyper-root', phaseClass, className)} aria-hidden>
      <div className="sudar-fp-warp-rush" aria-hidden />
      <svg
        className="sudar-fp-speed-lines"
        viewBox="0 0 800 600"
        xmlns="http://www.w3.org/2000/svg"
        preserveAspectRatio="xMidYMid slice"
      >
        {FP_STREAKS.map((s) => (
          <line
            key={s.cls}
            className={cn('sudar-fp-streak', s.cls)}
            x1="0"
            y1={s.y}
            x2={s.x2}
            y2={s.y}
            strokeWidth={s.sw}
          />
        ))}
      </svg>
      <div className="sudar-fp-hyper-stage">
        <div ref={mainRef} className="sudar-fp-hyper-main">
          <FpHyperLogoScene />
        </div>
      </div>
    </div>
  )
}

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
  /** `fullpage` = warp streak hero (dashboard route loading); default = premium mark */
  visual?: 'default' | 'fullpage'
  className?: string
  /** Override center mark (default: SudarPremiumMark or SudarFullpageMark when visual=fullpage) */
  children?: ReactNode
}

export function SudarLoadingFrost({
  label,
  ariaLabel,
  variant = 'section',
  layout = 'overlay',
  visual = 'default',
  className,
  children,
}: FrostProps) {
  const position =
    layout === 'block'
      ? 'relative z-20 w-full min-h-[inherit]'
      : variant === 'fixed'
        ? 'fixed inset-0 z-[100]'
        : 'absolute inset-0 z-20'

  const defaultMark =
    visual === 'fullpage' ? <SudarFullpageMark className="max-w-full" /> : <SudarPremiumMark />

  const frostSurface =
    visual === 'fullpage'
      ? 'bg-background/65 dark:bg-background/70 backdrop-blur-2xl backdrop-saturate-150'
      : 'bg-background/40 dark:bg-background/50 backdrop-blur-xl backdrop-saturate-150'

  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center gap-4 p-6 sm:p-8',
        position,
        'rounded-[inherit]',
        frostSurface,
        className
      )}
      role="status"
      aria-live="polite"
      aria-busy="true"
      aria-label={ariaLabel ?? label ?? 'Loading'}
    >
      {children ?? defaultMark}
      {label ? (
        <p className="text-sm font-medium text-muted-foreground text-center max-w-xs">{label}</p>
      ) : null}
    </div>
  )
}

import type { SVGProps } from 'react'
import { cn } from '@/lib/utils'

/** Keep usage presets aligned with `docs/brand/visual-system.md` (Product UI). */

const PILL_PATH =
  'M32,0 L138,0 C155.673,0 170,14.3269 170,32 C170,49.6731 155.673,64 138,64 L32,64 C14.3269,64 0,49.6731 0,32 C0,14.3269 14.3269,0 32,0 Z'

const STAR_PATH =
  'M50,2 C51,49 51,49 98,50 C51,51 51,51 50,98 C49,51 49,51 2,50 C49,49 49,49 50,2 Z'

type MarkProps = SVGProps<SVGSVGElement> & {
  /** Fill for the star “cut-out” — match the surface behind the logo for the correct look */
  starFill?: string
  /** Subtle breathing scale (FAB, onboarding hero, chat chrome) */
  animated?: boolean
  /**
   * Motion preset. When set, overrides `animated`.
   * `loading` — float + star shimmer for route and modality loaders.
   */
  motion?: 'none' | 'pulse' | 'loading'
}

export function SudarLogoMark({
  className,
  starFill = 'var(--background)',
  animated = false,
  motion: motionProp,
  ...props
}: MarkProps) {
  const motion = motionProp ?? (animated ? 'pulse' : 'none')
  return (
    <svg
      viewBox="400 28 230 142"
      preserveAspectRatio="xMidYMid meet"
      aria-hidden="true"
      className={cn(
        'origin-center',
        motion === 'pulse' && 'motion-safe:animate-sudar-logo-pulse',
        motion === 'loading' && 'motion-safe:animate-sudar-logo-drift',
        className
      )}
      {...props}
    >
      <g transform="translate(407,100)">
        <path d={PILL_PATH} fill="currentColor" fillRule="evenodd" />
      </g>
      <g transform="translate(447,36)">
        <path d={PILL_PATH} fill="currentColor" fillRule="evenodd" />
      </g>
      <g transform="translate(467,55) scale(0.9)">
        <path
          d={STAR_PATH}
          fill={starFill}
          fillRule="nonzero"
          className={motion === 'loading' ? 'motion-safe:animate-sudar-star-shimmer' : undefined}
        />
        {motion === 'pulse' && (
          <path
            d={STAR_PATH}
            fill="none"
            stroke="currentColor"
            strokeWidth={1.35}
            strokeLinejoin="round"
            vectorEffect="nonScalingStroke"
            className="motion-safe:animate-sudar-star-rim-glow pointer-events-none"
          />
        )}
      </g>
    </svg>
  )
}

type LockupProps = {
  className?: string
  markClassName?: string
  wordmarkClassName?: string
  starFill?: string
  animated?: boolean
  motion?: 'none' | 'pulse' | 'loading'
}

export function SudarLogoLockup({
  className,
  markClassName,
  wordmarkClassName,
  starFill = 'var(--background)',
  animated,
  motion,
}: LockupProps) {
  return (
    <span className={cn('inline-flex items-center gap-2', className)}>
      <SudarLogoMark className={markClassName} starFill={starFill} animated={animated} motion={motion} />
      <span className={wordmarkClassName}>Sudar</span>
    </span>
  )
}

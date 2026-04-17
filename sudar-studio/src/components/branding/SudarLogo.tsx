import type { SVGProps } from 'react'
import { cn } from '@/lib/utils'

/**
 * Sudar mark — path data and transforms MUST match `assets/sudar logo/Sudar_Logo.svg`.
 * Product UI presets: `docs/brand/visual-system.md`.
 */

const PILL_PATH =
  'M32,0 L138,0 C155.673,0 170,14.3269 170,32 C170,49.6731 155.673,64 138,64 L32,64 C14.3269,64 0,49.6731 0,32 C0,14.3269 14.3269,0 32,0'

const STAR_PATH =
  'M50,2 C51,49 51,49 98,50 C51,51 51,51 50,98 C49,51 49,51 2,50 C49,49 49,49 50,2'

const GEOMETRY_LOCK_NOTE =
  'SUDAR_LOGO_GEOMETRY_LOCK: Do not edit path d or transforms; mirror assets/sudar logo/Sudar_Logo.svg. Use matrix(0.9,0,0,0.9,467,55) for the star group—not translate+scale. Do not rebuild pills with rect rx.'

type MarkProps = SVGProps<SVGSVGElement> & {
  starFill?: string
  animated?: boolean
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
      viewBox="407 -5 210 210"
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
      <metadata>{GEOMETRY_LOCK_NOTE}</metadata>
      <g fillRule="evenodd">
        <g transform="translate(407,100)">
          <path d={PILL_PATH} fill="currentColor" />
        </g>
        <g transform="translate(447,36)">
          <path d={PILL_PATH} fill="currentColor" />
        </g>
        <g transform="matrix(0.9,0,0,0.9,467,55)">
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

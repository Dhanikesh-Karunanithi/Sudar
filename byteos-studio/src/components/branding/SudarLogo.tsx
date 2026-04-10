import type { SVGProps } from 'react'
import { cn } from '@/lib/utils'

const PILL_PATH =
  'M32,0 L138,0 C155.673,0 170,14.3269 170,32 C170,49.6731 155.673,64 138,64 L32,64 C14.3269,64 0,49.6731 0,32 C0,14.3269 14.3269,0 32,0 Z'

const STAR_PATH =
  'M50,2 C51,49 51,49 98,50 C51,51 51,51 50,98 C49,51 49,51 2,50 C49,49 49,49 50,2 Z'

type MarkProps = SVGProps<SVGSVGElement> & {
  starFill?: string
  animated?: boolean
}

export function SudarLogoMark({
  className,
  starFill = 'var(--background)',
  animated = false,
  ...props
}: MarkProps) {
  return (
    <svg
      viewBox="400 28 230 142"
      preserveAspectRatio="xMidYMid meet"
      aria-hidden="true"
      className={cn('origin-center', animated && 'motion-safe:animate-sudar-logo-pulse', className)}
      {...props}
    >
      <g transform="translate(407,100)">
        <path d={PILL_PATH} fill="currentColor" fillRule="evenodd" />
      </g>
      <g transform="translate(447,36)">
        <path d={PILL_PATH} fill="currentColor" fillRule="evenodd" />
      </g>
      <g transform="translate(467,55) scale(0.9)">
        <path d={STAR_PATH} fill={starFill} fillRule="nonzero" />
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
}

export function SudarLogoLockup({
  className,
  markClassName,
  wordmarkClassName,
  starFill = 'var(--background)',
  animated,
}: LockupProps) {
  return (
    <span className={cn('inline-flex items-center gap-2', className)}>
      <SudarLogoMark className={markClassName} starFill={starFill} animated={animated} />
      <span className={wordmarkClassName}>Sudar</span>
    </span>
  )
}

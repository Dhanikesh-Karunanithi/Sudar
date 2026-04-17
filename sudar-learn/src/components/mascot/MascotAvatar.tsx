'use client'

import { cn } from '@/lib/utils'
import { SudarLogoMark } from '@/components/branding/SudarLogo'
import { MASCOT_PERSONAS } from '@/lib/mascot/personas'
import type { MascotId } from '@/types/mascot'

const SIZE_CLASS = {
  xs: 'h-5 w-5 min-h-5 min-w-5',
  sm: 'h-7 w-7 min-h-7 min-w-7',
  md: 'h-10 w-10 min-h-10 min-w-10',
  lg: 'h-11 w-11 min-h-11 min-w-11',
} as const

const MARK_SCALE = {
  xs: 'h-[78%] w-auto',
  sm: 'h-[78%] w-auto',
  md: 'h-[80%] w-auto',
  lg: 'h-[80%] w-auto',
} as const

export interface MascotAvatarProps {
  mascotId: MascotId
  size?: keyof typeof SIZE_CLASS
  className?: string
  /** Star cutout fill — match the surface behind the mark (see `SudarLogoMark` in TopNav). */
  starFill?: string
}

export function MascotAvatar({
  mascotId,
  size = 'md',
  className,
  starFill = 'var(--card)',
}: MascotAvatarProps) {
  const persona = MASCOT_PERSONAS[mascotId]

  return (
    <span
      role="img"
      aria-label={persona.name}
      className={cn(
        SIZE_CLASS[size],
        'inline-flex shrink-0 items-center justify-center rounded-xl border border-border bg-card p-0.5',
        className,
      )}
    >
      <SudarLogoMark className={cn(MARK_SCALE[size], 'text-primary')} starFill={starFill} />
    </span>
  )
}

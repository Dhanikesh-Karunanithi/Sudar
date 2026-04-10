'use client'

import { useState } from 'react'
import { Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'
import { MASCOT_PERSONAS } from '@/lib/mascot/personas'
import type { MascotId } from '@/types/mascot'

const SIZE_CLASS = {
  xs: 'h-5 w-5 min-h-5 min-w-5',
  sm: 'h-7 w-7 min-h-7 min-w-7',
  md: 'h-10 w-10 min-h-10 min-w-10',
  lg: 'h-11 w-11 min-h-11 min-w-11',
} as const

function FallbackIcon({ size }: { size: keyof typeof SIZE_CLASS }) {
  const iconClass = size === 'xs' ? 'h-3 w-3' : size === 'sm' ? 'h-3.5 w-3.5' : 'h-4 w-4'
  return <Sparkles className={iconClass} aria-hidden />
}

export interface MascotAvatarProps {
  mascotId: MascotId
  size?: keyof typeof SIZE_CLASS
  className?: string
}

export function MascotAvatar({ mascotId, size = 'md', className }: MascotAvatarProps) {
  const [broken, setBroken] = useState(false)
  const persona = MASCOT_PERSONAS[mascotId]

  if (broken) {
    return (
      <span
        className={cn(
          SIZE_CLASS[size],
          'inline-flex shrink-0 items-center justify-center rounded-xl border border-border bg-muted text-primary',
          className,
        )}
        role="img"
        aria-label={persona.name}
      >
        <FallbackIcon size={size} />
      </span>
    )
  }

  return (
    <img
      src={persona.avatarSrc}
      alt="Sudar"
      width={size === 'xs' ? 20 : size === 'sm' ? 28 : size === 'md' ? 40 : 44}
      height={size === 'xs' ? 20 : size === 'sm' ? 28 : size === 'md' ? 40 : 44}
      className={cn(
        SIZE_CLASS[size],
        'shrink-0 rounded-xl border border-border bg-card object-contain object-center p-0.5',
        className,
      )}
      onError={() => setBroken(true)}
    />
  )
}

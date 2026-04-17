'use client'

import { cn } from '@/lib/utils'
import type { ExperiencePackSlug } from '@/lib/themes/experiencePacks'

interface Props {
  pack: Exclude<ExperiencePackSlug, 'none'>
  className?: string
}

/** CSS-first ambient shell; motion accents load separately. */
export function ExperienceAmbientLayer({ pack, className }: Props) {
  return (
    <div
      className={cn(
        'course-experience-ambient pointer-events-none absolute inset-0 z-0 overflow-hidden',
        className
      )}
      aria-hidden
      data-experience={pack}
    >
      <div className="course-experience-ambient-base" />
      <div className="course-experience-ambient-shimmer" />
    </div>
  )
}

'use client'

import { Palette } from 'lucide-react'
import { cn } from '@/lib/utils'
import { COURSE_ART_PATTERN_OPTION_GROUPS, type CourseArtPattern } from '@/lib/courseDefaultArt'
import { setCourseArtPattern, useCourseArtPattern } from '@/hooks/useCourseArtPattern'

type Props = {
  className?: string
  id?: string
  /** Dense layout for catalog / course headers (shorter copy). */
  compact?: boolean
}

export function CourseArtPatternSelect({ className, id = 'course-art-pattern', compact }: Props) {
  const pattern = useCourseArtPattern()

  return (
    <div
      className={cn(compact ? 'flex flex-col gap-1.5 sm:flex-row sm:items-center sm:gap-3' : 'space-y-2', className)}
      title="Applies to courses without a custom thumbnail or banner. Saved in this browser only."
    >
      <div className={cn('min-w-0', compact ? 'sm:flex-1' : undefined)}>
        <label
          htmlFor={id}
          className={cn(
            'flex items-center gap-1.5 font-medium text-muted-foreground',
            compact ? 'text-[11px] uppercase tracking-wide' : 'text-xs'
          )}
        >
          <Palette className="h-3.5 w-3.5 shrink-0 text-primary" aria-hidden />
          {compact ? 'Default art' : 'Default course art pattern'}
        </label>
        {!compact ? (
          <p className="text-[11px] text-muted-foreground leading-snug mt-1 max-w-prose">
            Shown on cards and banners when no image is uploaded. Color accents still come from each
            course&apos;s ID and difficulty (not random). Your pick applies to{' '}
            <span className="font-medium text-card-foreground/90">all such courses</span> in this
            browser—including ones that already exist.
          </p>
        ) : null}
      </div>
      <select
        id={id}
        value={pattern}
        onChange={(e) => setCourseArtPattern(e.target.value as CourseArtPattern)}
        className={cn(
          'rounded-button border border-border bg-card text-sm text-card-foreground',
          'px-2.5 py-1.5 min-h-[2.25rem] focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40',
          compact ? 'w-full sm:w-auto sm:min-w-[11rem]' : 'w-full max-w-md'
        )}
        aria-label="Choose default pattern for generated course thumbnails and banners"
      >
        {COURSE_ART_PATTERN_OPTION_GROUPS.map((g) => (
          <optgroup key={g.group} label={g.group}>
            {g.options.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </optgroup>
        ))}
      </select>
    </div>
  )
}

'use client'

import { Waves } from 'lucide-react'
import { useCourseExperience } from '@/components/learn/CourseExperienceProvider'
import { cn } from '@/lib/utils'

export function CourseShellCalmToggle() {
  const { activePack, effectiveCalm, setCalmMode, systemReducedMotion } = useCourseExperience()
  if (activePack === 'none') return null

  return (
    <button
      type="button"
      onClick={() => setCalmMode(!effectiveCalm)}
      disabled={systemReducedMotion}
      title={
        systemReducedMotion
          ? 'Reduced motion is on for your system'
          : effectiveCalm
            ? 'Show immersive background'
            : 'Reduce motion and decorative visuals'
      }
      aria-label={
        effectiveCalm ? 'Show immersive background for this course' : 'Reduce motion and decorative visuals'
      }
      aria-pressed={effectiveCalm}
      className={cn(
        'flex items-center gap-1.5 shrink-0 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-colors',
        'border-border bg-muted/80 text-muted-foreground hover:text-card-foreground hover:bg-muted',
        effectiveCalm && 'border-primary/30 bg-primary/5 text-primary',
        systemReducedMotion && 'opacity-60 cursor-not-allowed'
      )}
    >
      <Waves className="h-3.5 w-3.5 shrink-0" aria-hidden />
      <span className="hidden sm:inline">{effectiveCalm ? 'Full look' : 'Calm'}</span>
    </button>
  )
}

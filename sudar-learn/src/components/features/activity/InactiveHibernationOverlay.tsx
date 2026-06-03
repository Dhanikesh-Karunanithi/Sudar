'use client'

import { HibernationAnimation } from '@/components/features/activity/HibernationAnimation'
import type { ActivityTrackingState } from './useInactivityHibernation'

interface InactiveHibernationOverlayProps {
  trackingState: ActivityTrackingState
  warningRemainingSecs: number
  onResumeIntent: () => void
}

export function InactiveHibernationOverlay({
  trackingState,
  warningRemainingSecs,
  onResumeIntent,
}: InactiveHibernationOverlayProps) {
  if (trackingState === 'active') return null

  const isWarning = trackingState === 'warning'

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center"
      role="dialog"
      aria-modal="true"
      aria-live="polite"
      aria-label={isWarning ? 'Inactivity warning' : 'Application hibernating due to inactivity'}
      onPointerDown={onResumeIntent}
      onKeyDown={onResumeIntent}
      tabIndex={0}
    >
      <div className="absolute inset-0 bg-background/55 backdrop-blur-md" />
      <div className="relative mx-4 w-full max-w-md rounded-2xl border border-border/80 bg-card/80 p-6 text-center shadow-2xl backdrop-blur">
        <HibernationAnimation isWarning={isWarning} className="mb-4" />

        <p className="text-sm font-semibold text-foreground">
          {isWarning ? 'Sudar will hibernate soon' : 'Sudar is hibernating'}
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          {isWarning
            ? `No activity detected. Hibernation in ${warningRemainingSecs}s.`
            : 'Interact anywhere to continue your learning session.'}
        </p>

        <button
          type="button"
          onClick={onResumeIntent}
          className="mt-4 rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground hover:opacity-95"
        >
          Continue Learning
        </button>
      </div>
    </div>
  )
}

import { Globe, ExternalLink } from 'lucide-react'
import { cn } from '@/lib/utils'
import { getExternalProviderMeta } from '@/lib/courses/externalProviders'

type Variant = 'compact' | 'banner' | 'ribbon'

export function ExternalCourseLabel({
  provider,
  variant = 'compact',
  className,
}: {
  provider: string | null | undefined
  variant?: Variant
  className?: string
}) {
  const meta = getExternalProviderMeta(provider)

  if (variant === 'ribbon') {
    return (
      <div
        className={cn(
          'flex items-center justify-center gap-2 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wide',
          'bg-amber-500/15 text-amber-900 dark:text-amber-100 border-b border-amber-500/30',
          className,
        )}
        role="status"
      >
        <Globe className="w-3.5 h-3.5 shrink-0" aria-hidden />
        <span>External course · Hosted on {meta.shortLabel}</span>
        <ExternalLink className="w-3 h-3 opacity-70" aria-hidden />
      </div>
    )
  }

  if (variant === 'banner') {
    return (
      <div
        className={cn(
          'rounded-lg border border-amber-500/35 bg-amber-500/10 px-4 py-3 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4',
          className,
        )}
        role="status"
      >
        <div className="flex items-center gap-2 min-w-0">
          <Globe className="w-4 h-4 text-amber-700 dark:text-amber-300 shrink-0" aria-hidden />
          <div>
            <p className="text-sm font-semibold text-card-foreground">External open course</p>
            <p className="text-xs text-muted-foreground">
              Content plays from <span className="font-medium">{meta.label}</span> inside Sudar. Progress
              is tracked here when you mark complete.
            </p>
          </div>
        </div>
        <span
          className={cn(
            'inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-pill border shrink-0',
            meta.accentClass,
          )}
        >
          {meta.shortLabel}
        </span>
      </div>
    )
  }

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-pill border',
        meta.accentClass,
        className,
      )}
    >
      <Globe className="w-3 h-3" aria-hidden />
      External · {meta.shortLabel}
    </span>
  )
}

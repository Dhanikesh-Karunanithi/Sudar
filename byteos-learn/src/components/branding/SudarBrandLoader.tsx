import { cn } from '@/lib/utils'
import { SudarLogoMark } from '@/components/branding/SudarLogo'

/** Compact row for `loading.tsx` shells above skeleton content */
export function SudarLoadingStrip({
  label = 'Loading…',
  className,
  starFill = 'var(--background)',
  markClassName,
}: {
  label?: string
  className?: string
  starFill?: string
  markClassName?: string
}) {
  return (
    <div
      className={cn('flex items-center gap-3 text-muted-foreground', className)}
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <SudarLogoMark
        className={cn('h-7 w-auto shrink-0 text-primary', markClassName)}
        starFill={starFill}
        motion="loading"
      />
      <span className="text-sm font-medium">{label}</span>
    </div>
  )
}

type Size = 'sm' | 'md' | 'lg'

const logoSize: Record<Size, string> = {
  sm: 'h-8 w-auto',
  md: 'h-11 w-auto',
  lg: 'h-14 w-auto',
}

export function SudarBrandLoader({
  message,
  className,
  size = 'md',
  starFill = 'var(--background)',
  markClassName,
  glowClassName,
}: {
  message?: string
  className?: string
  size?: Size
  /** Match the surface behind the mark so the star reads correctly */
  starFill?: string
  markClassName?: string
  glowClassName?: string
}) {
  return (
    <div
      className={cn('flex flex-col items-center justify-center gap-3', className)}
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <div className="relative grid place-items-center">
        <div
          className={cn(
            'pointer-events-none absolute inset-[-12px] rounded-[1.75rem] bg-primary/25 motion-safe:animate-sudar-loader-glow blur-md motion-reduce:hidden',
            glowClassName
          )}
          aria-hidden
        />
        <SudarLogoMark
          className={cn('relative text-primary', logoSize[size], markClassName)}
          starFill={starFill}
          motion="loading"
        />
      </div>
      {message ? (
        <p className="text-sm text-muted-foreground text-center max-w-xs">{message}</p>
      ) : null}
    </div>
  )
}

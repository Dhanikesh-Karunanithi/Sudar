'use client'

import { cn } from '@/lib/utils'
import {
  SudarContentCreatingMark,
  SudarLoadingFrost,
  SudarMicroMark,
  SudarPremiumMark,
} from '@/components/branding/SudarPremiumLoader'

export { SudarLoadingFrost } from '@/components/branding/SudarPremiumLoader'

/** Brand inline wait (replaces spinner icons in buttons and compact UI) */
export function SudarInlineLoader({
  className,
  starFill,
  size = 'sm',
}: {
  className?: string
  /** Match surface behind the star “hole” (e.g. `var(--primary)` on primary buttons) */
  starFill?: string
  size?: 'sm' | 'md' | 'lg'
}) {
  return (
    <SudarMicroMark
      className={cn('shrink-0 text-primary', className)}
      starFill={starFill ?? 'var(--background)'}
      size={size}
    />
  )
}

/** Compact row for `loading.tsx` — scaled premium mark + frost bar */
export function SudarLoadingStrip({
  label = 'Loading…',
  className,
}: {
  label?: string
  className?: string
}) {
  return (
    <div
      className={cn(
        'flex items-center gap-4 rounded-xl px-4 py-3',
        'bg-background/45 dark:bg-background/55 backdrop-blur-xl backdrop-saturate-150',
        className
      )}
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <div className="relative h-11 w-[100px] shrink-0 overflow-hidden flex items-center justify-center">
        <div className="absolute left-1/2 top-1/2 w-[360px] h-[220px] -translate-x-1/2 -translate-y-1/2 scale-[0.22]">
          <SudarPremiumMark className="min-h-0 min-w-0 [&_.sudar-premium-scene]:max-w-none" />
        </div>
      </div>
      <span className="text-sm font-medium text-muted-foreground">{label}</span>
    </div>
  )
}

type Size = 'sm' | 'md' | 'lg'

const sceneScale: Record<Size, string> = {
  sm: 'scale-[0.72]',
  md: 'scale-[0.88]',
  lg: 'scale-[1]',
}

export function SudarBrandLoader({
  message,
  className,
  size = 'md',
  frostClassName,
  /** `none` = no frosted panel or border; animation sits on the page background */
  surface = 'frost',
}: {
  message?: string
  className?: string
  size?: Size
  /** Extra classes on the outer wrapper */
  frostClassName?: string
  surface?: 'frost' | 'none'
}) {
  const plain = surface === 'none'
  return (
    <div
      className={cn(
        'relative flex min-h-[260px] w-full flex-col items-stretch',
        plain ? 'overflow-visible rounded-none border-0 bg-transparent' : 'overflow-hidden rounded-2xl',
        frostClassName
      )}
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <SudarLoadingFrost
        variant="section"
        layout="block"
        label={message}
        className={cn(
          'min-h-[260px]',
          plain && '!border-0 !bg-transparent !p-0 !shadow-none !backdrop-blur-none !backdrop-saturate-100',
          className
        )}
      >
        <div className={cn('origin-center motion-reduce:scale-100', sceneScale[size])}>
          <SudarContentCreatingMark className="min-h-0" />
        </div>
      </SudarLoadingFrost>
    </div>
  )
}

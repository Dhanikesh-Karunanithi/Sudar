import type { SVGProps } from 'react'
import { cn } from '@/lib/utils'

/**
 * SudarNotes page accent — open study notebook with a learning ember.
 * Distinct from the Sudar S-logo (nav + chat). Speaks “notebook + insight.”
 */
type Props = SVGProps<SVGSVGElement>

export function LearnWithSudarMark({ className, ...props }: Props) {
  return (
    <svg
      viewBox="0 0 40 40"
      fill="none"
      aria-hidden="true"
      className={cn('text-primary', className)}
      {...props}
    >
      <rect
        x="1.25"
        y="1.25"
        width="37.5"
        height="37.5"
        rx="11"
        className="fill-primary/10 stroke-primary/20"
        strokeWidth="1.25"
      />
      {/* Spine / back page */}
      <path
        d="M9.5 11h15c1.66 0 3 1.34 3 3v13.5c0 1.66-1.34 3-3 3h-15c-1.1 0-2-.9-2-2V13c0-1.1.9-2 2-2Z"
        className="fill-card stroke-primary/35"
        strokeWidth="1.2"
      />
      {/* Open front page */}
      <path
        d="M12 12.75h12.25c1.24 0 2.25 1.01 2.25 2.25V28c0 1.24-1.01 2.25-2.25 2.25H12c-.97 0-1.75-.78-1.75-1.75V14.5c0-.97.78-1.75 1.75-1.75Z"
        className="fill-primary/10 stroke-primary/45"
        strokeWidth="1.15"
      />
      {/* Notebook lines */}
      <path
        d="M13.75 18h8.5M13.75 21.25h8.5M13.75 24.5h5"
        className="stroke-primary/40"
        strokeWidth="1.2"
        strokeLinecap="round"
      />
      {/* Learning ember — soft diamond/star, not the S mark */}
      <path
        d="M30.5 9.5 L32.2 13.2 L36 14.9 L32.2 16.6 L30.5 20.3 L28.8 16.6 L25 14.9 L28.8 13.2 Z"
        className="fill-primary"
      />
      <circle cx="30.5" cy="14.9" r="1.35" className="fill-[var(--background)]" />
    </svg>
  )
}

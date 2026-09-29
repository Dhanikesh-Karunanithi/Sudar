'use client'

import { useEffect, useState } from 'react'
import { ChevronDown, Target } from 'lucide-react'
import { cn } from '@/lib/utils'
import { MODULE_CLAIMS_COPY } from '@/constants/teachingCopy'
import type { ModuleClaimWithMastery } from '@/types/teaching'

function claimStatus(c: ModuleClaimWithMastery): { label: string; tone: string } {
  if (c.next_review_at && new Date(c.next_review_at).getTime() <= Date.now()) {
    return { label: MODULE_CLAIMS_COPY.reviewDue, tone: 'text-amber-700 dark:text-amber-300' }
  }
  if (c.mastered) return { label: MODULE_CLAIMS_COPY.mastered, tone: 'text-emerald-700 dark:text-emerald-300' }
  if (c.p_know != null) return { label: MODULE_CLAIMS_COPY.inProgress, tone: 'text-primary' }
  return { label: MODULE_CLAIMS_COPY.notStarted, tone: 'text-muted-foreground' }
}

/** Teaching OS claims linked to a module, with the learner's mastery. Renders nothing when no claims are linked. */
export function ModuleClaimsStrip({ moduleId, refreshKey }: { moduleId: string; refreshKey?: number }) {
  const [claims, setClaims] = useState<ModuleClaimWithMastery[]>([])
  const [open, setOpen] = useState(false)

  useEffect(() => {
    let cancelled = false
    void fetch(`/api/teaching/module-claims?module_id=${encodeURIComponent(moduleId)}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((body: { success?: boolean; data?: { claims?: ModuleClaimWithMastery[] } } | null) => {
        if (!cancelled) setClaims(body?.data?.claims ?? [])
      })
      .catch(() => {
        if (!cancelled) setClaims([])
      })
    return () => {
      cancelled = true
    }
  }, [moduleId, refreshKey])

  if (claims.length === 0) return null

  const masteredCount = claims.filter((c) => c.mastered).length

  return (
    <section className="mb-6 rounded-xl border border-border bg-card/60 px-4 py-3">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-label={open ? MODULE_CLAIMS_COPY.collapseLabel : MODULE_CLAIMS_COPY.expandLabel}
        className="flex w-full items-center justify-between gap-3 text-left"
      >
        <span className="flex items-center gap-2 text-sm font-medium text-card-foreground">
          <Target className="h-4 w-4 text-primary" aria-hidden />
          {MODULE_CLAIMS_COPY.heading}
        </span>
        <span className="flex items-center gap-2 text-xs text-muted-foreground">
          {masteredCount}/{claims.length}
          <ChevronDown className={cn('h-4 w-4 transition-transform', open && 'rotate-180')} aria-hidden />
        </span>
      </button>
      {open ? (
        <ul className="mt-3 space-y-2">
          {claims.map((c) => {
            const status = claimStatus(c)
            const pct = Math.round((c.p_know ?? 0) * 100)
            return (
              <li key={c.id} className="text-sm">
                <div className="flex items-start justify-between gap-3">
                  <span className="text-card-foreground">{c.stem}</span>
                  <span className={cn('shrink-0 text-xs font-medium', status.tone)}>{status.label}</span>
                </div>
                <div
                  className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-muted"
                  role="progressbar"
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-valuenow={pct}
                  aria-label={c.stem}
                >
                  <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${pct}%` }} />
                </div>
              </li>
            )
          })}
        </ul>
      ) : null}
    </section>
  )
}

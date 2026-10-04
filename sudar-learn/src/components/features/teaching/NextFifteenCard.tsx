'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { Brain, RotateCw } from 'lucide-react'
import { BentoCard } from '@/components/ui/BentoCard'
import { NEXT_FIFTEEN_COPY } from '@/constants/teachingCopy'
import { OPEN_TUTOR_EVENT, type OpenTutorDetail } from '@/lib/tutor/proactiveEvents'
import type { SchedulerCandidate } from '@/types/teaching'

type LoadState =
  | { status: 'loading' }
  | { status: 'error' }
  | { status: 'ready'; queue: SchedulerCandidate[] }

function typeLabel(type: SchedulerCandidate['type']): string {
  return (NEXT_FIFTEEN_COPY.typeLabels as Record<string, string>)[type] ?? NEXT_FIFTEEN_COPY.typeLabels.review_claim
}

/**
 * Teaching OS "next 15 minutes" (spaced review → weak claims → prerequisite gaps).
 * Hidden for learners with no claim history so the dashboard stays calm before Teaching OS applies to them.
 */
export function NextFifteenCard({ journeyEnabled }: { journeyEnabled: boolean }) {
  const [state, setState] = useState<LoadState>({ status: 'loading' })

  const load = useCallback(() => {
    setState({ status: 'loading' })
    void fetch('/api/teaching/next-fifteen')
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
      .then((body: { data?: { queue?: SchedulerCandidate[] } }) => {
        setState({ status: 'ready', queue: body.data?.queue ?? [] })
      })
      .catch(() => setState({ status: 'error' }))
  }, [])

  useEffect(() => {
    load()
  }, [load])

  if (state.status === 'loading') {
    return <div className="h-24 animate-pulse rounded-2xl bg-muted/60" aria-hidden />
  }

  if (state.status === 'error') {
    return (
      <BentoCard padding="md" className="flex items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">{NEXT_FIFTEEN_COPY.error}</p>
        <button
          type="button"
          onClick={load}
          className="inline-flex items-center gap-1.5 rounded-button px-3 py-1.5 text-xs font-medium text-primary hover:bg-primary/10"
        >
          <RotateCw className="h-3.5 w-3.5" aria-hidden /> {NEXT_FIFTEEN_COPY.retry}
        </button>
      </BentoCard>
    )
  }

  const actionable = state.queue.filter((c) => c.type !== 'explore_domain')
  if (state.queue.length === 0) return null

  const items = (actionable.length ? actionable : state.queue).slice(0, 3)
  const top = items[0]

  const askSudar = (c: SchedulerCandidate) => {
    const detail: OpenTutorDetail = { message: `${NEXT_FIFTEEN_COPY.askPrefix} ${c.title ?? c.reason}` }
    window.dispatchEvent(new CustomEvent(OPEN_TUTOR_EVENT, { detail }))
  }

  return (
    <BentoCard padding="md" className="space-y-3">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10">
          <Brain className="h-5 w-5 text-primary" aria-hidden />
        </div>
        <h2 className="font-display text-lg font-bold text-card-foreground">{NEXT_FIFTEEN_COPY.heading}</h2>
      </div>

      {actionable.length === 0 ? (
        <div>
          <p className="text-sm font-medium text-card-foreground">{NEXT_FIFTEEN_COPY.emptyTitle}</p>
          <p className="mt-0.5 text-xs text-muted-foreground">{NEXT_FIFTEEN_COPY.emptyBody}</p>
        </div>
      ) : (
        <ul className="space-y-2">
          {items.map((c) => (
            <li
              key={`${c.type}:${c.claim_ids[0] ?? ''}`}
              className="flex items-start justify-between gap-3 rounded-button px-3 py-2 hover:bg-muted"
            >
              <div className="min-w-0">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-primary">{typeLabel(c.type)}</p>
                <p className="truncate text-sm text-card-foreground">{c.title ?? c.reason}</p>
              </div>
              <button
                type="button"
                onClick={() => askSudar(c)}
                className="shrink-0 rounded-button px-3 py-1.5 text-xs font-medium text-primary hover:bg-primary/10"
                aria-label={`${NEXT_FIFTEEN_COPY.reviewCta}: ${c.title ?? c.reason}`}
              >
                {NEXT_FIFTEEN_COPY.reviewCta}
              </button>
            </li>
          ))}
        </ul>
      )}

      {journeyEnabled && top ? (
        <Link href="/journey" className="inline-block text-xs font-medium text-accent hover:opacity-90">
          {NEXT_FIFTEEN_COPY.notebookCta} →
        </Link>
      ) : null}
    </BentoCard>
  )
}

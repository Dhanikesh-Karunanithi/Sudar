'use client'

import { useEffect, useState } from 'react'
import type { LearnerDomainSummary } from '@/types/teaching'

const DOMAIN_KEY = 'sudar.journey.domain'
const FREE_STUDY_VALUE = ''

export function loadJourneyDomainId(): string | null {
  try {
    return sessionStorage.getItem(DOMAIN_KEY) || null
  } catch {
    return null
  }
}

/**
 * Lets the learner anchor SudarNotes to one of their org's Teaching OS domains so checks and
 * mastery use real claims. Hidden when the org has no domains (free study only).
 */
export function JourneyDomainPicker({
  value,
  onChange,
}: {
  value: string | null
  onChange: (domainId: string | null) => void
}) {
  const [domains, setDomains] = useState<LearnerDomainSummary[]>([])

  useEffect(() => {
    let cancelled = false
    void fetch('/api/journey/domains')
      .then((r) => (r.ok ? r.json() : null))
      .then((body: { data?: { domains?: LearnerDomainSummary[] } } | null) => {
        if (cancelled) return
        const list = body?.data?.domains ?? []
        setDomains(list)
        if (value && !list.some((d) => d.id === value)) onChange(null)
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- load once
  }, [])

  if (domains.length === 0) return null

  return (
    <label className="journey-mono inline-flex items-center gap-2 text-[11px] text-muted-foreground">
      Studying
      <select
        value={value ?? FREE_STUDY_VALUE}
        onChange={(e) => {
          const next = e.target.value || null
          try {
            if (next) sessionStorage.setItem(DOMAIN_KEY, next)
            else sessionStorage.removeItem(DOMAIN_KEY)
          } catch {
            /* ignore */
          }
          onChange(next)
        }}
        className="max-w-[16rem] rounded-[2px] border border-border bg-card px-2 py-1 text-xs text-card-foreground"
        aria-label="Choose what to study with Sudar"
      >
        <option value={FREE_STUDY_VALUE}>Anything (free study)</option>
        {domains.map((d) => (
          <option key={d.id} value={d.id}>
            {d.title}
          </option>
        ))}
      </select>
    </label>
  )
}

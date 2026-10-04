'use client'

import { useCallback, useState } from 'react'
import { Volume2 } from 'lucide-react'
import type { SimCoachResult } from '@shared-sudarsim/schemas'

export function SimCoachReport({
  result,
  onRetry,
  onContinue,
}: {
  result: SimCoachResult & {
    coach_narrative?: string
    coach_report?: { narrative?: string; learner_reflection?: string | null }
  }
  onRetry?: () => void
  onContinue?: () => void
}) {
  const narrative =
    result.coach_narrative ??
    (result as { coach_report?: { narrative?: string } }).coach_report?.narrative ??
    ''
  const reflection =
    (result as { coach_report?: { learner_reflection?: string | null } }).coach_report
      ?.learner_reflection ?? null

  const [speaking, setSpeaking] = useState(false)

  const speakSummary = useCallback(() => {
    if (!narrative || typeof window === 'undefined' || !window.speechSynthesis) return
    window.speechSynthesis.cancel()
    const utterance = new SpeechSynthesisUtterance(narrative.slice(0, 1200))
    utterance.rate = 0.95
    utterance.onstart = () => setSpeaking(true)
    utterance.onend = () => setSpeaking(false)
    utterance.onerror = () => setSpeaking(false)
    window.speechSynthesis.speak(utterance)
  }, [narrative])

  return (
    <div className="space-y-6 rounded-xl border border-border bg-card p-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h2 className="text-xl font-semibold text-foreground">Coach feedback</h2>
        <span
          className={`rounded-full px-3 py-1 text-sm font-medium ${
            result.passed ? 'bg-emerald-500/15 text-emerald-600' : 'bg-amber-500/15 text-amber-600'
          }`}
        >
          {result.passed ? 'Passed' : 'Needs practice'} · {Math.round(result.overall_score)}%
        </span>
      </div>

      {reflection ? (
        <div className="rounded-lg border border-border bg-muted/30 p-3 text-sm">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Your reflection</p>
          <p className="mt-1 text-foreground">{reflection}</p>
        </div>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-2">
        {Object.entries(result.dimension_scores ?? {}).map(([key, score]) => (
          <div key={key} className="rounded-lg border border-border p-3">
            <p className="text-sm font-medium capitalize text-foreground">{key.replace(/_/g, ' ')}</p>
            <p className="text-2xl font-bold text-primary">{Math.round(Number(score))}</p>
          </div>
        ))}
      </div>

      {narrative ? (
        <div className="space-y-2">
          <div className="rounded-lg bg-muted/50 p-4 text-sm leading-relaxed text-foreground">{narrative}</div>
          <button
            type="button"
            onClick={speakSummary}
            disabled={speaking}
            className="inline-flex items-center gap-2 rounded-lg border border-border px-3 py-1.5 text-xs font-medium hover:bg-muted disabled:opacity-50"
            aria-label="Listen to coach summary"
          >
            <Volume2 className="h-4 w-4" aria-hidden />
            {speaking ? 'Playing…' : 'Listen to summary'}
          </button>
        </div>
      ) : null}

      {(result.replay_moments ?? []).length > 0 ? (
        <div className="space-y-3">
          <h3 className="font-medium text-foreground">Replay moments</h3>
          {result.replay_moments.map((m, i) => (
            <div key={i} className="rounded-lg border border-border p-3 text-sm">
              <p className="text-xs text-muted-foreground">{m.ts}</p>
              <p className="font-medium text-foreground">{m.issue}</p>
              <p className="mt-1 text-muted-foreground">{m.suggestion}</p>
            </div>
          ))}
        </div>
      ) : null}

      <div className="flex flex-wrap gap-3">
        {onRetry ? (
          <button
            type="button"
            onClick={onRetry}
            className="rounded-lg border border-border px-4 py-2 text-sm font-medium hover:bg-muted"
          >
            Try again
          </button>
        ) : null}
        {onContinue ? (
          <button
            type="button"
            onClick={onContinue}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
          >
            Continue
          </button>
        ) : null}
      </div>
    </div>
  )
}

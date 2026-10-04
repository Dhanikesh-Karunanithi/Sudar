'use client'

import { useState } from 'react'

export function SimCoachReflection({
  onSubmit,
  onSkip,
  loading,
}: {
  onSubmit: (reflection: string) => void
  onSkip: () => void
  loading?: boolean
}) {
  const [reflection, setReflection] = useState('')

  return (
    <div className="mx-auto max-w-lg space-y-4 rounded-xl border border-border bg-card p-6">
      <h2 className="text-xl font-semibold text-foreground">How do you think it went?</h2>
      <p className="text-sm text-muted-foreground">
        Before Sudar shows your score, share a quick reflection. What felt strong? What would you do differently?
      </p>
      <textarea
        value={reflection}
        onChange={(e) => setReflection(e.target.value)}
        disabled={loading}
        rows={4}
        className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm disabled:opacity-50"
        placeholder="I think I handled the opening well, but I rushed the resolution…"
        aria-label="Session reflection"
      />
      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          disabled={loading || !reflection.trim()}
          onClick={() => onSubmit(reflection.trim())}
          className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50"
        >
          {loading ? 'Scoring…' : 'See my coach feedback'}
        </button>
        <button
          type="button"
          disabled={loading}
          onClick={onSkip}
          className="rounded-lg border border-border px-4 py-2 text-sm font-medium hover:bg-muted disabled:opacity-50"
        >
          Skip reflection
        </button>
      </div>
    </div>
  )
}

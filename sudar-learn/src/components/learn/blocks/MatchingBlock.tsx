'use client'

import { useState, useMemo } from 'react'

interface Pair {
  term: string
  definition: string
}

export function MatchingBlock({
  pairs,
  instruction,
}: {
  pairs: Pair[]
  instruction?: string
}) {
  const [selections, setSelections] = useState<Record<number, number>>({})
  const [submitted, setSubmitted] = useState(false)
  const shuffledDefs = useMemo(
    () => [...(pairs ?? [])].map((p) => p.definition).sort(() => Math.random() - 0.5),
    [pairs]
  )
  const score =
    submitted && pairs
      ? pairs.filter((_, i) => pairs[i] && selections[i] === shuffledDefs.indexOf(pairs[i].definition)).length
      : null

  if (!pairs?.length) return null
  return (
    <div className="my-6 rounded-xl border border-border bg-card p-4">
      {instruction && (
        <p className="text-sm text-muted-foreground mb-4">{instruction}</p>
      )}
      <div className="space-y-3">
        {(pairs as Pair[]).map((pair, i) => (
          <div
            key={i}
            className="flex flex-col sm:flex-row sm:items-center gap-2 rounded-lg border border-border bg-muted/30 p-3"
          >
            <span className="text-sm font-medium text-card-foreground shrink-0">
              {pair.term}
            </span>
            <select
              value={selections[i] ?? ''}
              onChange={(e) =>
                setSelections((s) => ({ ...s, [i]: Number(e.target.value) }))
              }
              disabled={submitted}
              className="flex-1 rounded-md border border-border bg-card px-3 py-2 text-sm text-card-foreground"
            >
              <option value="">— Select match —</option>
              {shuffledDefs.map((def, j) => (
                <option key={j} value={j}>
                  {def}
                </option>
              ))}
            </select>
          </div>
        ))}
      </div>
      {!submitted ? (
        <button
          type="button"
          onClick={() => setSubmitted(true)}
          className="mt-4 px-4 py-2 rounded-lg text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90"
        >
          Check answers
        </button>
      ) : (
        <p className="mt-4 text-sm font-medium text-card-foreground">
          Score: {score} / {pairs.length}
        </p>
      )}
    </div>
  )
}

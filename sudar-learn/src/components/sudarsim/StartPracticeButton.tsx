'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, Play } from 'lucide-react'
import { PRACTICE_COPY } from '@/constants/practiceCopy'

export function StartPracticeButton({ scenarioId, title }: { scenarioId: string; title: string }) {
  const router = useRouter()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function start() {
    setBusy(true)
    setError(null)
    try {
      const res = await fetch('/api/sim/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scenario_id: scenarioId }),
      })
      const data = (await res.json().catch(() => null)) as { success?: boolean; session_id?: string } | null
      if (!res.ok || !data?.success || !data.session_id) throw new Error('start failed')
      router.push(`/sim/session/${data.session_id}`)
    } catch {
      setError(PRACTICE_COPY.startError)
      setBusy(false)
    }
  }

  return (
    <div className="flex flex-col items-start gap-1">
      <button
        type="button"
        onClick={() => void start()}
        disabled={busy}
        className="inline-flex items-center gap-2 rounded-button bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
        aria-label={`${PRACTICE_COPY.start}: ${title}`}
      >
        {busy ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <Play className="h-4 w-4" aria-hidden />}
        {busy ? PRACTICE_COPY.starting : PRACTICE_COPY.start}
      </button>
      {error ? (
        <p className="text-xs text-destructive" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  )
}

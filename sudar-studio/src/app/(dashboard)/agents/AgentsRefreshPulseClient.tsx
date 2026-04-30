'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'

export function AgentsRefreshPulseClient({
  cohortPulseEnabled = true,
}: {
  cohortPulseEnabled?: boolean
}) {
  const [busy, setBusy] = useState(false)

  async function pulse() {
    setBusy(true)
    try {
      const res = await fetch('/api/agents/runs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ goal_kind: 'path_health' }),
      })
      const text = await res.text().catch(() => '')
      if (!res.ok && text) console.warn(text)
      window.location.reload()
    } finally {
      setBusy(false)
    }
  }

  return (
    <button
      type="button"
      onClick={() => void pulse()}
      disabled={busy || !cohortPulseEnabled}
      title={!cohortPulseEnabled ? 'Enable cohort pulse in Org settings → Sudar Agents.' : undefined}
      className={cn(
        'shrink-0 rounded-lg px-4 py-2.5 text-sm font-medium transition-colors border',
        'border-indigo-500/40 bg-indigo-600/15 text-indigo-200 hover:bg-indigo-600/25 disabled:opacity-50',
      )}
    >
      {busy ? 'Running…' : 'Run cohort pulse'}
    </button>
  )
}

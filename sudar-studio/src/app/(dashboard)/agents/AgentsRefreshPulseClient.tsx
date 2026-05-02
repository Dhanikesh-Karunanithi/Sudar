'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'

/** FastAPI HTTPException body is often `{ "detail": "..." }` — Next may use `{ "error": "..." }`. */
function fastApiErrorBody(j: Record<string, unknown>): string | null {
  if (typeof j.error === 'string') return j.error
  const d = j.detail
  if (typeof d === 'string') return d
  if (Array.isArray(d) && d.length > 0) {
    const first = d[0]
    if (typeof first === 'string') return first
    if (first && typeof first === 'object' && first !== null && 'msg' in first) {
      const m = (first as { msg?: unknown }).msg
      return typeof m === 'string' ? m : null
    }
  }
  return null
}

function parsePulseResponse(text: string, ok: boolean): { message: string; isFailedRun: boolean } {
  if (!text.trim()) {
    return {
      message: ok
        ? 'Request finished with no JSON body — check the runs table below or refresh.'
        : 'Something went wrong (empty response).',
      isFailedRun: false,
    }
  }
  try {
    const j = JSON.parse(text) as Record<string, unknown>
    if (!ok) {
      const apiErr = fastApiErrorBody(j)
      return { message: apiErr ?? text.slice(0, 400), isFailedRun: false }
    }
    const runId = typeof j.run_id === 'string' ? j.run_id : null
    const status = typeof j.status === 'string' ? j.status : ''
    const errRun = typeof j.error === 'string' ? j.error : ''
    const headline =
      j.artifact && typeof j.artifact === 'object' && j.artifact !== null && 'headline' in j.artifact
        ? typeof (j.artifact as { headline?: unknown }).headline === 'string'
          ? (j.artifact as { headline: string }).headline
          : ''
        : ''
    if (ok && status === 'failed')
      return { message: errRun || 'Sudar Agents run completed with status failed.', isFailedRun: true }
    if (ok && runId) {
      const bits = [`Run recorded (${runId.slice(0, 8)}…).`, status && `Status: ${status}.`, headline && headline].filter(
        Boolean,
      )
      return { message: bits.join(' '), isFailedRun: false }
    }
    if (ok) return { message: 'Cohort pulse request succeeded.', isFailedRun: false }
    return { message: errRun || text.slice(0, 400), isFailedRun: false }
  } catch {
    return { message: ok ? text.slice(0, 400) : text.slice(0, 400) || `HTTP error`, isFailedRun: false }
  }
}

export function AgentsRefreshPulseClient({
  cohortPulseEnabled = true,
}: {
  cohortPulseEnabled?: boolean
}) {
  const [busy, setBusy] = useState(false)
  const [banner, setBanner] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null)

  async function pulse() {
    setBusy(true)
    setBanner(null)
    try {
      const res = await fetch('/api/agents/runs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ goal_kind: 'path_health' }),
      })
      const text = await res.text().catch(() => '')
      const { message, isFailedRun } = parsePulseResponse(text, res.ok)

      if (!res.ok || isFailedRun) {
        let extra = ''
        if (message.includes('SUPABASE_JWT_SECRET')) {
          extra =
            ' Fix: create or edit sudar-intelligence/.env.local, set SUPABASE_JWT_SECRET to the same JWT Secret as Supabase (Project Settings → API), restart Intelligence — this file loads automatically on startup.'
        } else if (res.status === 503) {
          extra =
            ' Is Sudar Intelligence running and SUDAR_INTELLIGENCE_URL (or BYTEOS_INTELLIGENCE_URL) set on Studio?'
        } else if (res.status === 403) {
          extra = ' Check Org settings → Sudar Agents (enabled + cohort pulse).'
        }
        setBanner({ kind: 'err', text: `${message}${extra}` })
        return
      }

      setBanner({ kind: 'ok', text: message })
      window.setTimeout(() => {
        window.location.reload()
      }, 1400)
    } catch {
      setBanner({
        kind: 'err',
        text: 'Network error calling /api/agents/runs — check connectivity and Studio logs.',
      })
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="flex flex-col items-stretch gap-2 sm:items-end max-w-md sm:max-w-lg">
      {banner && (
        <div
          role="status"
          className={cn(
            'text-sm rounded-lg px-3 py-2 border text-left',
            banner.kind === 'ok'
              ? 'border-emerald-500/35 bg-emerald-500/10 text-emerald-100'
              : 'border-amber-500/40 bg-amber-500/10 text-amber-100',
          )}
        >
          {banner.text}
          {banner.kind === 'ok' ? <span className="block text-xs text-emerald-200/70 mt-1">Refreshing…</span> : null}
        </div>
      )}
      <button
        type="button"
        onClick={() => void pulse()}
        disabled={busy || !cohortPulseEnabled}
        title={!cohortPulseEnabled ? 'Enable cohort pulse in Org settings → Sudar Agents.' : undefined}
        className={cn(
          'shrink-0 rounded-lg px-4 py-2.5 text-sm font-medium transition-colors border self-end sm:self-end',
          'border-indigo-500/40 bg-indigo-600/15 text-indigo-200 hover:bg-indigo-600/25 disabled:opacity-50',
        )}
      >
        {busy ? 'Running…' : 'Run cohort pulse'}
      </button>
    </div>
  )
}

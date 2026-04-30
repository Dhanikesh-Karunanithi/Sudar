'use client'

import Link from 'next/link'
import { useState } from 'react'
import { Bot, BookMarked } from 'lucide-react'
import { cn } from '@/lib/utils'
import { AgentsRefreshPulseClient } from './AgentsRefreshPulseClient'

export type AgentRunRow = {
  id: string
  team: string | null
  goal_kind: string | null
  status: string | null
  created_at: string | null
  error: string | null
}

export function SudarAgentsPageClient({
  runs,
  initialAdvanced,
  cohortPulseEnabled = true,
}: {
  runs: AgentRunRow[]
  initialAdvanced: boolean
  cohortPulseEnabled?: boolean
}) {
  const [advanced, setAdvanced] = useState(initialAdvanced)

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <div className="w-12 h-12 rounded-xl bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center shrink-0">
            <Bot className="w-6 h-6 text-indigo-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Sudar Agents</h1>
            <p className="text-slate-400 text-sm mt-1 max-w-xl">
              Lightweight automation Sudar runs for your org — cohort health pulses and learner week-plan sketches grounded in telemetry.
            </p>
          </div>
        </div>
        <AgentsRefreshPulseClient cohortPulseEnabled={cohortPulseEnabled} />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => setAdvanced(false)}
          className={cn(
            'rounded-lg px-3 py-1.5 text-sm font-medium border transition-colors',
            !advanced ? 'border-indigo-400 bg-indigo-500/20 text-indigo-100' : 'border-slate-700 text-slate-400 hover:bg-slate-800/60',
          )}
        >
          Simple
        </button>
        <button
          type="button"
          onClick={() => setAdvanced(true)}
          className={cn(
            'rounded-lg px-3 py-1.5 text-sm font-medium border transition-colors',
            advanced ? 'border-indigo-400 bg-indigo-500/20 text-indigo-100' : 'border-slate-700 text-slate-400 hover:bg-slate-800/60',
          )}
        >
          Advanced
        </button>
        <Link
          href="https://github.com/Dhanikesh-Karunanithi/Sudar/blob/main/docs/AGENTS_PLATFORM.md"
          target="_blank"
          rel="noreferrer"
          className={cn(
            'inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium border border-slate-600 text-indigo-300 hover:bg-slate-800/80',
          )}
        >
          <BookMarked className="w-3.5 h-3.5" />
          Documentation
        </Link>
      </div>

      {!advanced ? (
        <section className="rounded-xl border border-slate-800 bg-slate-900/40 p-6 space-y-4 text-slate-300 text-sm">
          <h2 className="text-white font-semibold text-base">What this page is for</h2>
          <p>
            It lists recent Sudar Agents runs stored for your organisation. Each row is one bounded job (for example a cohort pulse) with a{' '}
            <span className="text-slate-200">team</span>, <span className="text-slate-200">goal</span>, and <span className="text-slate-200">status</span>.
          </p>
          <p>
            <strong className="text-slate-200">Run cohort pulse</strong> asks Sudar Intelligence to summarise path rollups and risk signals — useful when you want a snapshot before a quarterly review or after assigning a new path.
          </p>
          <p>
            Data used: path analytics, optional learner rollups, and org-scoped risk snippets already in your Supabase project. Nothing here is a separate chat history; it is an audit trail for automation.
          </p>
          <p className="text-slate-500 text-xs">
            Privacy: only org admins with access to this Studio workspace can see this table. Learners do not see admin cohort views.
          </p>
        </section>
      ) : (
        <section className="rounded-xl border border-slate-800 bg-slate-900/40 p-6 space-y-3 text-slate-400 text-sm">
          <h2 className="text-white font-semibold text-base">Advanced</h2>
          <p>
            Full architecture, env vars, Intelligence routes, and LMS integrator notes live in{' '}
            <Link href="https://github.com/Dhanikesh-Karunanithi/Sudar/blob/main/docs/AGENTS_PLATFORM.md" className="text-indigo-400 underline">
              docs/AGENTS_PLATFORM.md
            </Link>
            .
          </p>
          <ul className="list-disc pl-5 space-y-1">
            <li>
              <span className="text-slate-300">goal_kind</span> — e.g. <code className="text-xs bg-slate-800 px-1 rounded">path_health</code> for admin cohort pulse; learners use week plans via Learn APIs only.
            </li>
            <li>
              <span className="text-slate-300">artifact</span> — compact structured output per run (not streamed chat); persisted in Postgres for compliance review.
            </li>
            <li>
              Org flags and feature toggles: <strong className="text-slate-300">Org settings → Sudar Agents</strong> (<code className="text-xs bg-slate-800 px-1 rounded">sudar_agents</code> in <code className="text-xs bg-slate-800 px-1 rounded">organisations.settings</code>).
            </li>
          </ul>
        </section>
      )}

      <p className="text-sm text-slate-500">
        Reference also in-repo: docs/AGENTS_PLATFORM.md · Trust posture: docs/trust/
      </p>

      {!runs.length ? (
        <div className="rounded-xl border border-border bg-card p-8 text-muted-foreground text-center">
          No agent runs logged yet — trigger a cohort pulse above after Intelligence is reachable.
        </div>
      ) : (
        <div className="rounded-xl border border-border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/60 text-muted-foreground text-left uppercase text-[11px] tracking-wide">
              <tr>
                <th className="px-4 py-3 font-medium">When</th>
                <th className="px-4 py-3 font-medium">Team</th>
                <th className="px-4 py-3 font-medium">Goal</th>
                <th className="px-4 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {runs.map((r) => (
                <tr key={r.id} className="border-t border-border hover:bg-muted/30">
                  <td className="px-4 py-3 text-card-foreground whitespace-nowrap">{r.created_at?.slice(0, 16)} UTC</td>
                  <td className="px-4 py-3 text-card-foreground">{r.team}</td>
                  <td className="px-4 py-3 text-card-foreground">{r.goal_kind}</td>
                  <td className="px-4 py-3">
                    <span className={r.status === 'failed' ? 'text-red-400' : 'text-emerald-400'}>{r.status}</span>
                    {r.error ? (
                      <p className="text-xs text-muted-foreground mt-1 truncate max-w-md" title={r.error}>
                        {r.error}
                      </p>
                    ) : null}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

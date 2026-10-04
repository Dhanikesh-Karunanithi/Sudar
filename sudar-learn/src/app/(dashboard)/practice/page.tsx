import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { MessagesSquare } from 'lucide-react'
import { createClient, createServiceRoleSupabaseClient } from '@/lib/supabase/server'
import { BentoCard } from '@/components/ui/BentoCard'
import { StartPracticeButton } from '@/components/sudarsim/StartPracticeButton'
import { PRACTICE_COPY } from '@/constants/practiceCopy'

export const metadata: Metadata = { title: 'Practice' }

type ScenarioRow = {
  id: string
  title: string
  channels: string[] | null
  persona: { name?: string; backstory?: string } | null
}

export default async function PracticePage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const admin = createServiceRoleSupabaseClient()
  // Must match the org check in POST /api/sim/session so every listed scenario can start.
  const { data: profile } = await admin.from('profiles').select('org_id').eq('id', user.id).maybeSingle()
  const orgId = (profile as { org_id: string | null } | null)?.org_id ?? null

  let scenarios: ScenarioRow[] = []
  if (orgId) {
    const { data } = await admin
      .from('sim_scenarios')
      .select('id, title, channels, persona')
      .eq('org_id', orgId)
      .eq('status', 'published')
      .order('updated_at', { ascending: false })
      .limit(50)
    scenarios = (data ?? []) as unknown as ScenarioRow[]
  }

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-6">
      <header>
        <h1 className="font-display text-2xl font-bold text-card-foreground md:text-3xl">{PRACTICE_COPY.title}</h1>
        <p className="mt-1 max-w-2xl text-sm text-muted-foreground">{PRACTICE_COPY.subtitle}</p>
      </header>

      {scenarios.length === 0 ? (
        <BentoCard padding="md" className="flex items-start gap-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-muted">
            <MessagesSquare className="h-5 w-5 text-muted-foreground" aria-hidden />
          </div>
          <div>
            <p className="text-sm font-semibold text-card-foreground">{PRACTICE_COPY.emptyTitle}</p>
            <p className="mt-0.5 text-xs text-muted-foreground">{PRACTICE_COPY.emptyBody}</p>
          </div>
        </BentoCard>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2">
          {scenarios.map((s) => (
            <li key={s.id}>
              <BentoCard padding="md" className="flex h-full flex-col gap-3">
                <div className="flex-1">
                  <h2 className="text-base font-semibold text-card-foreground">{s.title}</h2>
                  {s.persona?.name ? (
                    <p className="mt-1 line-clamp-3 text-xs text-muted-foreground">
                      {s.persona.name}
                      {s.persona.backstory ? ` — ${s.persona.backstory}` : ''}
                    </p>
                  ) : null}
                  {s.channels?.length ? (
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {s.channels.map((c) => (
                        <span
                          key={c}
                          className="rounded-full border border-border bg-muted px-2 py-0.5 text-[11px] text-muted-foreground"
                        >
                          {PRACTICE_COPY.channels[c] ?? c}
                        </span>
                      ))}
                    </div>
                  ) : null}
                </div>
                <StartPracticeButton scenarioId={s.id} title={s.title} />
              </BentoCard>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

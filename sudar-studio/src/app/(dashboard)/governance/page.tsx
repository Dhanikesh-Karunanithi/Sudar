import { createClient, createServiceRoleSupabaseClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { requireOrgAdmin } from '@/lib/org'
import Link from 'next/link'
import { ShieldCheck, BookOpen, FileText, ExternalLink, Server } from 'lucide-react'

const TRUST_DOCS_BASE =
  'https://github.com/Dhanikesh-Karunanithi/Sudar/blob/main/docs/trust'

export default async function GovernancePage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  let orgId: string
  try {
    orgId = await requireOrgAdmin(user.id)
  } catch {
    redirect('/')
  }

  const admin = createServiceRoleSupabaseClient()
  const { data: org } = await admin.from('organisations').select('settings').eq('id', orgId).single()
  const settings = (org?.settings as Record<string, unknown>) ?? {}
  const ac = (settings.ai_compliance as Record<string, unknown>) ?? {}

  const blockPii = ac.block_high_risk_pii_in_tutor !== false
  const redactEcho = ac.tutor_redact_echoed_secrets !== false
  const strictOut = ac.tutor_output_moderation_strict === true
  const requireConsent = ac.require_learner_consent === true
  const allowGenPers = ac.allow_generative_personalization !== false

  const persDays = ac.personalization_data_retention_days
  const leDays = ac.learning_events_retention_days
  const aiDays = ac.ai_interactions_retention_days
  const memPol = ac.tutor_llm_memory_extraction_policy === 'disabled_org_wide'
  const memHours = ac.tutor_llm_memory_min_interval_hours
  const digestDaysOrg = ac.memory_digest_min_interval_days_org

  const rows: { label: string; on: boolean; note?: string }[] = [
    { label: 'Block high-risk patterns in tutor and Studio chat (cards, SSN-style, keys)', on: blockPii },
    { label: 'Redact card-like sequences from tutor model output', on: redactEcho },
    {
      label: 'Strict output moderation (extra redaction on tutor and Studio agent replies)',
      on: strictOut,
      note: 'When on, applies additional pattern redaction to model text.',
    },
    { label: 'Generative personalization allowed', on: allowGenPers },
    { label: 'Learner consent required before personalization', on: requireConsent },
    {
      label: 'LLM tutor memory updates (profile inference + digest)',
      on: !memPol,
      note: memPol
        ? 'Organisation has disabled LLM-driven tutor memory updates for all members.'
        : typeof memHours === 'number'
          ? `Minimum ${memHours}h between profile-inference LLM runs (org floor).`
          : 'Learner-controlled cadence (no org minimum-hour floor).',
    },
    ...(typeof digestDaysOrg === 'number'
      ? [
          {
            label: 'Long-range digest minimum spacing (org)',
            on: true,
            note: `At least ${digestDaysOrg} day(s) between digest LLM runs.`,
          } as const,
        ]
      : []),
  ]

  return (
    <div className="p-8 max-w-3xl mx-auto space-y-8">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center">
          <ShieldCheck className="w-6 h-6 text-emerald-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white">Governance and trust</h1>
          <p className="text-slate-400 text-sm">
            Transparency for your organisation — not legal advice. Training assignment tracking lives under{' '}
            <Link href="/compliance" className="text-indigo-400 hover:text-indigo-300">
              Training compliance
            </Link>
            .
          </p>
        </div>
      </div>

      <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-6 space-y-4">
        <h2 className="font-semibold text-white flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          Protections for this organisation
        </h2>
        <p className="text-slate-500 text-sm">
          Values reflect Org settings (AI personalization and privacy). Change them in{' '}
          <Link href="/settings" className="text-indigo-400 hover:text-indigo-300">
            Org settings
          </Link>
          .
        </p>
        <ul className="space-y-2">
          {rows.map((r) => (
            <li
              key={r.label}
              className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 rounded-lg border border-slate-800 bg-slate-950/40 px-3 py-2"
            >
              <span className="text-slate-300 text-sm">{r.label}</span>
              <span
                className={
                  r.on
                    ? 'text-xs font-medium text-emerald-400 shrink-0'
                    : 'text-xs font-medium text-slate-500 shrink-0'
                }
              >
                {r.on ? 'On' : 'Off'}
              </span>
              {r.note ? <p className="text-xs text-slate-500 sm:w-full sm:order-3">{r.note}</p> : null}
            </li>
          ))}
        </ul>
      </div>

      <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-6 space-y-3">
        <h2 className="font-semibold text-white flex items-center gap-2">
          <Server className="w-4 h-4 text-slate-400" />
          AI data routing
        </h2>
        <p className="text-slate-500 text-sm">
          Sudar can send learner questions and Studio generation to either cloud AI providers (using API keys) or a private server on your network.
          Routing is configured in{' '}
          <Link href="/settings" className="text-indigo-400 hover:text-indigo-300">
            Org settings
          </Link>{' '}
          under &quot;Where Sudar runs your AI&quot;, when your operator has enabled that option.
        </p>
        <p className="text-slate-500 text-sm">
          Plain-language guide:{' '}
          <Link href="/help/ai-at-sudar" className="text-indigo-400 hover:text-indigo-300">
            Understanding AI in Sudar
          </Link>
          . Technical trust context:{' '}
          <a
            href={`${TRUST_DOCS_BASE}/THREAT_MODEL.md`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-indigo-400 hover:text-indigo-300 inline-flex items-center gap-1"
          >
            Threat model <ExternalLink className="w-3 h-3 opacity-60" />
          </a>
        </p>
      </div>

      <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-6 space-y-3">
        <h2 className="font-semibold text-white text-sm">Documented retention (days)</h2>
        <p className="text-slate-500 text-xs">
          Stored in Org settings for policy alignment. Automated deletion jobs are not implied — implement per deployment.
        </p>
        <ul className="text-sm text-slate-300 space-y-1 font-mono text-xs">
          <li>AI personalization overlays: {typeof persDays === 'number' ? persDays : '—'}</li>
          <li>Learning events: {typeof leDays === 'number' ? leDays : '—'}</li>
          <li>AI tutor interactions: {typeof aiDays === 'number' ? aiDays : '—'}</li>
        </ul>
      </div>

      <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-6 space-y-3">
        <h2 className="font-semibold text-white flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-indigo-400" />
          Documentation
        </h2>
        <p className="text-slate-500 text-sm">
          Technical trust pack in the Sudar repository (data flows, subprocessors, shared responsibility, threat model).
        </p>
        <ul className="space-y-2 text-sm">
          <li>
            <a
              href={`${TRUST_DOCS_BASE}/README.md`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-indigo-400 hover:text-indigo-300 inline-flex items-center gap-1"
            >
              <FileText className="w-3.5 h-3.5" /> Trust overview
              <ExternalLink className="w-3 h-3 opacity-60" />
            </a>
          </li>
          <li>
            <a
              href={`${TRUST_DOCS_BASE}/SHARED_RESPONSIBILITY.md`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-indigo-400 hover:text-indigo-300 inline-flex items-center gap-1"
            >
              Shared responsibility
              <ExternalLink className="w-3 h-3 opacity-60" />
            </a>
          </li>
          <li>
            <a
              href={`${TRUST_DOCS_BASE}/SUBPROCESSORS.md`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-indigo-400 hover:text-indigo-300 inline-flex items-center gap-1"
            >
              Subprocessors
              <ExternalLink className="w-3 h-3 opacity-60" />
            </a>
          </li>
        </ul>
      </div>

      <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4 text-sm text-amber-200/90">
        Data export and erasure for GDPR-style requests are operated with your deployment team. See{' '}
        <span className="font-mono text-xs">docs/trust/OPERATIONS.md</span> in the repo for the runbook outline.
      </div>
    </div>
  )
}

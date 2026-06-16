import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { ShieldCheck, FileText, Download, ExternalLink } from 'lucide-react'

export const metadata = { title: 'Data governance' }

export default async function SettingsGovernancePage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  return (
    <div className="p-8 max-w-3xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Data governance</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Retention, compliance posture, audit trails, and export options for your organisation.
        </p>
      </div>

      <section className="rounded-xl border border-border bg-card p-6 space-y-4">
        <h2 className="font-semibold text-foreground flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-emerald-400" /> Compliance posture
        </h2>
        <ul className="space-y-2 text-sm text-muted-foreground">
          <li>
            <strong className="text-foreground">GDPR / UK GDPR:</strong> Sudar is deployer-controlled. You remain
            data controller; configure retention and consent in org settings.
          </li>
          <li>
            <strong className="text-foreground">FERPA (US education):</strong> Learning records stay in your Supabase
            project or self-hosted stack. No learner model sale or third-party ad use.
          </li>
          <li>
            <strong className="text-foreground">SOC 2:</strong> Reference architecture supports audit logging; formal
            SOC 2 attestation depends on your deployment and subprocessors.
          </li>
        </ul>
        <Link href="/governance" className="text-sm text-indigo-400 hover:underline inline-flex items-center gap-1">
          Open live governance controls <ExternalLink className="w-3.5 h-3.5" />
        </Link>
      </section>

      <section className="rounded-xl border border-border bg-card p-6 space-y-4">
        <h2 className="font-semibold text-foreground flex items-center gap-2">
          <FileText className="w-5 h-5 text-indigo-400" /> Audit &amp; retention
        </h2>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Set learning event, AI interaction, and personalization retention in{' '}
          <Link href="/settings" className="text-indigo-400 hover:underline">
            Org settings
          </Link>
          . MCP tool calls and agent runs are logged when integrations are enabled.
        </p>
      </section>

      <section className="rounded-xl border border-border bg-card p-6 space-y-4">
        <h2 className="font-semibold text-foreground flex items-center gap-2">
          <Download className="w-5 h-5 text-indigo-400" /> Export formats
        </h2>
        <p className="text-sm text-muted-foreground leading-relaxed">
          SCORM 1.2 export ships today from course editor. SCORM 2004 and IMS Common Cartridge are planned Q3 2026.
        </p>
        <Link href="/help/article/admins/export-formats" className="text-sm text-indigo-400 hover:underline">
          Help: export formats →
        </Link>
      </section>
    </div>
  )
}

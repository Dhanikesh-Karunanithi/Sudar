import { createAdminClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { Award, CheckCircle2, Calendar, Building2, BadgeCheck, Route } from 'lucide-react'
import Link from 'next/link'
import { CertActions } from './CertActions'

export default async function CertificatePage({ params }: { params: { code: string } }) {
  const admin = createAdminClient()

  const { data: cert } = await admin
    .from('certifications')
    .select('*, path:learning_paths(title, description, courses)')
    .eq('verification_code', params.code)
    .single()

  if (!cert) notFound()

  const issuedDate = new Date(cert.issued_at).toLocaleDateString('en-GB', {
    day: 'numeric', month: 'long', year: 'numeric',
  })

  const courseCount = Array.isArray(cert.path?.courses) ? cert.path.courses.length : 0
  const pathTitle = cert.path_title ?? cert.path?.title ?? 'Learning Path'
  const recipientName = cert.recipient_name ?? 'Learner'
  const orgName = cert.org_name ?? 'Sudar'

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          body * { visibility: hidden; }
          #certificate, #certificate * { visibility: visible; }
          #certificate { position: absolute; left: 0; top: 0; width: 100%; max-width: 100%; box-shadow: none; }
        }
      ` }} />
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900 flex flex-col items-center justify-center px-4 py-12 print:bg-white print:py-4">
      {/* Cert card */}
      <div id="certificate" className="w-full max-w-2xl bg-white rounded-3xl shadow-2xl overflow-hidden print:shadow-none">
        {/* Header stripe */}
        <div className="bg-primary px-10 py-8 flex items-center gap-5">
          <div className="w-16 h-16 bg-white/15 backdrop-blur-sm rounded-2xl flex items-center justify-center shrink-0">
            <Award className="w-9 h-9 text-white" />
          </div>
          <div>
            <p className="text-primary-foreground/80 text-sm font-medium uppercase tracking-widest">Certificate of Completion</p>
            <h1 className="text-white text-2xl font-bold mt-0.5">{orgName}</h1>
          </div>
        </div>

        {/* Body */}
        <div className="px-10 py-10 space-y-8">
          <div className="text-center space-y-3">
            <p className="text-muted-foreground text-sm uppercase tracking-widest">This certifies that</p>
            <h2 className="text-4xl font-bold text-card-foreground font-serif" style={{ fontFamily: 'Georgia, serif' }}>{recipientName}</h2>
            <p className="text-muted-foreground text-base leading-relaxed">
              has successfully completed the learning path
            </p>
            <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 rounded-xl px-5 py-3">
              <Route className="w-5 h-5 text-primary shrink-0" />
              <span className="text-card-foreground font-semibold text-lg">{pathTitle}</span>
            </div>
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: 'Courses completed', value: courseCount > 0 ? `${courseCount} courses` : 'Full path', icon: CheckCircle2, color: 'text-green-600 bg-green-50 border-green-200' },
              { label: 'Issued on', value: issuedDate, icon: Calendar, color: 'text-primary bg-primary/10 border-primary/20' },
              { label: 'Issued by', value: orgName, icon: Building2, color: 'text-card-foreground bg-muted border-border' },
            ].map(({ label, value, icon: Icon, color }) => (
              <div key={label} className={`flex flex-col items-center text-center p-4 border rounded-2xl ${color}`}>
                <Icon className="w-5 h-5 mb-2 opacity-70" />
                <p className="text-[11px] uppercase tracking-widest opacity-70">{label}</p>
                <p className="text-sm font-semibold mt-0.5">{value}</p>
              </div>
            ))}
          </div>

          {/* Verification */}
          <div className="bg-muted border border-border rounded-2xl p-5 space-y-2">
            <div className="flex items-center gap-2">
              <BadgeCheck className="w-4 h-4 text-primary shrink-0" />
              <p className="text-xs font-semibold text-card-foreground uppercase tracking-widest">Verified credential</p>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              This certificate is publicly verifiable. Anyone with the link below can confirm its authenticity.
            </p>
            <div className="bg-white border border-border rounded-xl px-4 py-3 font-mono text-xs text-card-foreground break-all select-all">
              {cert.certificate_url ?? `https://byteos.app/cert/${params.code}`}
            </div>
            <p className="text-[11px] text-muted-foreground">Verification code: <span className="font-mono">{params.code}</span></p>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-border px-10 py-5">
          <p className="text-xs text-muted-foreground">Powered by <span className="font-semibold text-card-foreground">Sudar</span> — Learning with you, for you.</p>
        </div>
      </div>

      <CertActions code={params.code} />

      <p className="print:hidden text-muted-foreground text-xs mt-4">
        <Link href="/" className="hover:text-muted-foreground transition-colors">← Back to Sudar</Link>
      </p>
    </div>
    </>
  )
}

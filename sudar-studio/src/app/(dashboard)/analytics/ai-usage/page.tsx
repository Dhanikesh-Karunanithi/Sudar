import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { requireOrgAdmin } from '@/lib/org'
import { AiUsageDashboard } from '@/components/analytics/AiUsageDashboard'
import { ArrowLeft } from 'lucide-react'

export const metadata: Metadata = { title: 'AI usage — Analytics' }

export default async function AiUsagePage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  try {
    await requireOrgAdmin(user.id)
  } catch {
    redirect('/analytics')
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-6">
      <div>
        <Link
          href="/analytics"
          className="mb-3 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Analytics
        </Link>
        <h1 className="text-2xl font-bold tracking-tight">AI usage &amp; token estimates</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Marginal AI consumption across Sudar tutor, course generation, modalities, and Studio tools.
        </p>
      </div>
      <AiUsageDashboard />
    </div>
  )
}

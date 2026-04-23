import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

interface Props {
  searchParams: Promise<{ module_id?: string }>
}

export default async function SudarPlayLaunchPage({ searchParams }: Props) {
  const { module_id } = await searchParams
  if (!module_id) {
    redirect('/')
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const intelligenceUrl = (process.env.SUDAR_INTELLIGENCE_URL ?? process.env.BYTEOS_INTELLIGENCE_URL)?.replace(/\/$/, '')
  if (!intelligenceUrl) {
    return (
      <div className="p-6 text-center space-y-2">
        <p className="text-red-600">SudarPlay is not configured (SUDAR_INTELLIGENCE_URL missing).</p>
        <Link href="/courses" className="text-sm font-medium text-primary hover:underline">
          Return to courses
        </Link>
      </div>
    )
  }

  const { data: { session } } = await supabase.auth.getSession()
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  if (session?.access_token) headers['Authorization'] = `Bearer ${session.access_token}`

  const res = await fetch(`${intelligenceUrl}/api/sudarplay/launch-token`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      learner_id: user.id,
      module_id,
    }),
  })

  if (!res.ok) {
    const detail = (await res.json().catch(() => ({}))).detail ?? res.statusText
    return (
      <div className="p-6 text-center space-y-2">
        <p className="text-red-600">Could not start SudarPlay: {String(detail)}</p>
        <div className="flex items-center justify-center gap-4 text-sm">
          <Link href={`/sudarplay/launch?module_id=${encodeURIComponent(module_id)}`} className="font-medium text-primary hover:underline">
            Retry
          </Link>
          <Link href="/courses" className="font-medium text-primary hover:underline">
            Back to courses
          </Link>
        </div>
      </div>
    )
  }

  const { token, wa_url } = (await res.json()) as { token: string; wa_url: string }
  redirect(`${wa_url}?token=${encodeURIComponent(token)}`)
}

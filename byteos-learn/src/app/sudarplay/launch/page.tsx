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

  const intelligenceUrl = process.env.BYTEOS_INTELLIGENCE_URL?.replace(/\/$/, '')
  if (!intelligenceUrl) {
    return (
      <div className="p-6 text-center text-red-600">
        SudarPlay is not configured (BYTEOS_INTELLIGENCE_URL missing).
      </div>
    )
  }

  const res = await fetch(`${intelligenceUrl}/api/sudarplay/launch-token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      learner_id: user.id,
      module_id,
    }),
  })

  if (!res.ok) {
    const detail = (await res.json().catch(() => ({}))).detail ?? res.statusText
    return (
      <div className="p-6 text-center text-red-600">
        Could not start SudarPlay: {detail}
      </div>
    )
  }

  const { token, wa_url } = (await res.json()) as { token: string; wa_url: string }
  redirect(`${wa_url}?token=${encodeURIComponent(token)}`)
}

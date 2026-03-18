import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { logAuth } from '@/lib/logger'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/'

  if (code) {
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          },
        },
      }
    )

    const { data, error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error && data?.user?.email) {
      logAuth('sign_in')
      const admin = createAdminClient()
      const { data: invites } = await admin
        .from('org_invites')
        .select('org_id, role')
        .eq('email', data.user.email.toLowerCase())
      if (invites?.length) {
        for (const inv of invites) {
          await admin.from('profiles').update({ org_id: inv.org_id }).eq('id', data.user.id)
          const { data: existing } = await admin.from('org_members').select('id').eq('org_id', inv.org_id).eq('user_id', data.user.id).single()
          if (!existing) {
            await admin.from('org_members').insert({ org_id: inv.org_id, user_id: data.user.id, role: inv.role })
          }
          const { data: lp } = await admin.from('learner_profiles').select('id').eq('user_id', data.user.id).single()
          if (!lp) await admin.from('learner_profiles').insert({ user_id: data.user.id })
        }
        await admin.from('org_invites').delete().eq('email', data.user.email.toLowerCase())
      }
      return NextResponse.redirect(`${origin}${next}`)
    }
    if (error) logAuth('failed_login', { reason: error.message?.slice(0, 100) })
  }

  return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`)
}

import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

import {
  applyInviteToProfile,
  AUTH_INTENT_PARAM,
  checkUserInviteAccess,
  finalizePostAuthInvite,
  isNewAuthUser,
  parseAuthIntent,
  processOrgInvites,
  safeNextPath,
  VERIFIED_INVITE_COOKIE,
} from '@shared-access'
import type { AccessSupabaseClient } from '@shared-access/types'
import { createServiceRoleSupabaseClient } from '@/lib/supabase/server'
import { logAuth } from '@/lib/logger'

function deleteInviteCookie(response: NextResponse) {
  response.cookies.delete(VERIFIED_INVITE_COOKIE)
}

function signupRedirect(origin: string, error: string) {
  const signupUrl = new URL('/signup', origin)
  signupUrl.searchParams.set('error', error)
  const response = NextResponse.redirect(signupUrl.toString())
  deleteInviteCookie(response)
  return response
}

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = safeNextPath(searchParams.get('next') ?? '/')
  const intent = parseAuthIntent(searchParams.get(AUTH_INTENT_PARAM))

  if (!code) {
    return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`)
  }

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
  if (error || !data?.user) {
    if (error) logAuth('failed_login', { reason: error.message?.slice(0, 100) })
    return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`)
  }

  logAuth('sign_in')
  const admin = createServiceRoleSupabaseClient() as AccessSupabaseClient
  const user = data.user

  if (user.email) {
    await processOrgInvites(admin, user.id, user.email)
  }

  if (intent === 'login') {
    if (isNewAuthUser(user)) {
      await supabase.auth.signOut()
      return signupRedirect(origin, 'new_account_use_signup')
    }

    const access = await checkUserInviteAccess(user.id, admin)
    if (!access.hasAccess) {
      return signupRedirect(origin, 'invite_required')
    }

    await finalizePostAuthInvite(admin, user.id)
    const response = NextResponse.redirect(`${origin}${next}`)
    deleteInviteCookie(response)
    return response
  }

  if (intent === 'signup') {
    const verifiedInvite = cookieStore.get(VERIFIED_INVITE_COOKIE)?.value
    if (verifiedInvite) {
      await applyInviteToProfile(admin, user.id, verifiedInvite)
    }

    const access = await checkUserInviteAccess(user.id, admin)
    if (!access.hasAccess) {
      return signupRedirect(origin, 'invite_required')
    }

    await finalizePostAuthInvite(admin, user.id)
    const response = NextResponse.redirect(`${origin}${next}`)
    deleteInviteCookie(response)
    return response
  }

  const access = await checkUserInviteAccess(user.id, admin)
  if (!access.hasAccess) {
    return signupRedirect(origin, 'invite_required')
  }

  await finalizePostAuthInvite(admin, user.id)

  let redirectPath = next
  const { data: lp } = await admin
    .from('learner_profiles')
    .select('ai_tutor_context')
    .eq('user_id', user.id)
    .maybeSingle()
  const memory = (lp?.ai_tutor_context as Record<string, unknown>) ?? {}
  const skipCount = Number(memory.onboarding_skip_count ?? 0)
  if (memory.onboarding_complete !== 'true' && skipCount < 3) {
    redirectPath = '/onboarding'
  }

  const response = NextResponse.redirect(`${origin}${redirectPath}`)
  deleteInviteCookie(response)
  return response
}

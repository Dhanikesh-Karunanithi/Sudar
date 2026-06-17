import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

import {
  AUTH_INTENT_PARAM,
  createOAuthCallbackSupabase,
  deleteInviteCookie,
  loginErrorPath,
  parseAuthIntent,
  redirectWithAuthCookies,
  resolvePostOAuthRedirect,
  safeNextPath,
  signupErrorPath,
  type SessionCookie,
  VERIFIED_INVITE_COOKIE,
} from '@shared-access'
import type { AccessSupabaseClient } from '@shared-access/types'
import { createServiceRoleSupabaseClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  const sessionCookies: SessionCookie[] = []
  const supabase = createOAuthCallbackSupabase(request, sessionCookies)
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const origin = new URL(request.url).origin

  if (!user) {
    return redirectWithAuthCookies(
      `${origin}/login?error=auth_callback_failed`,
      sessionCookies
    )
  }

  const { searchParams } = new URL(request.url)
  const intent = parseAuthIntent(searchParams.get(AUTH_INTENT_PARAM))
  const next = safeNextPath(searchParams.get('next') ?? '/')
  const cookieStore = await cookies()
  const admin = createServiceRoleSupabaseClient() as AccessSupabaseClient

  const result = await resolvePostOAuthRedirect({
    user,
    intent,
    next,
    verifiedInviteCookie:
      request.cookies.get(VERIFIED_INVITE_COOKIE)?.value ??
      cookieStore.get(VERIFIED_INVITE_COOKIE)?.value,
    admin,
    onboardingRedirect: async (userId) => {
      const { data: lp } = await admin
        .from('learner_profiles')
        .select('ai_tutor_context')
        .eq('user_id', userId)
        .maybeSingle()
      const memory = (lp?.ai_tutor_context as Record<string, unknown>) ?? {}
      const skipCount = Number(memory.onboarding_skip_count ?? 0)
      if (memory.onboarding_complete !== 'true' && skipCount < 3) {
        return '/onboarding'
      }
      return null
    },
  })

  if (result.kind === 'login_error') {
    if (result.signOut) {
      await supabase.auth.signOut()
    }
    return redirectWithAuthCookies(
      `${origin}${loginErrorPath(result)}`,
      sessionCookies,
      deleteInviteCookie
    )
  }

  if (result.kind === 'signup_error') {
    return redirectWithAuthCookies(
      `${origin}${signupErrorPath(result.code)}`,
      sessionCookies,
      deleteInviteCookie
    )
  }

  return redirectWithAuthCookies(`${origin}${result.path}`, sessionCookies, deleteInviteCookie)
}

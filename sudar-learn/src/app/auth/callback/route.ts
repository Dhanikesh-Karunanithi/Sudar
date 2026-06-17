import { NextRequest } from 'next/server'

import {
  applyInviteToProfile,
  AUTH_INTENT_PARAM,
  checkUserInviteAccess,
  finalizePostAuthInvite,
  isNewAuthUser,
  parseAuthIntent,
  processOrgInvites,
  redirectWithAuthCookies,
  createOAuthCallbackSupabase,
  safeNextPath,
  type SessionCookie,
  VERIFIED_INVITE_COOKIE,
} from '@shared-access'
import type { AccessSupabaseClient } from '@shared-access/types'
import { createServiceRoleSupabaseClient } from '@/lib/supabase/server'
import { logAuth } from '@/lib/logger'
import type { NextResponse } from 'next/server'

function deleteInviteCookie(response: NextResponse) {
  response.cookies.delete(VERIFIED_INVITE_COOKIE)
}

function signupRedirect(
  origin: string,
  error: string,
  sessionCookies: SessionCookie[]
) {
  const signupUrl = new URL('/signup', origin)
  signupUrl.searchParams.set('error', error)
  return redirectWithAuthCookies(signupUrl.toString(), sessionCookies, deleteInviteCookie)
}

function finishRedirect(
  origin: string,
  path: string,
  sessionCookies: SessionCookie[]
) {
  return redirectWithAuthCookies(`${origin}${path}`, sessionCookies, deleteInviteCookie)
}

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = safeNextPath(searchParams.get('next') ?? '/')
  const intent = parseAuthIntent(searchParams.get(AUTH_INTENT_PARAM))
  const sessionCookies: SessionCookie[] = []

  if (!code) {
    return redirectWithAuthCookies(`${origin}/login?error=auth_callback_failed`, sessionCookies)
  }

  const supabase = createOAuthCallbackSupabase(request, sessionCookies)

  const { data, error } = await supabase.auth.exchangeCodeForSession(code)
  if (error || !data?.user) {
    if (error) logAuth('failed_login', { reason: error.message?.slice(0, 100) })
    return redirectWithAuthCookies(`${origin}/login?error=auth_callback_failed`, sessionCookies)
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
      return signupRedirect(origin, 'new_account_use_signup', sessionCookies)
    }

    const access = await checkUserInviteAccess(user.id, admin)
    if (!access.hasAccess) {
      return signupRedirect(origin, 'invite_required', sessionCookies)
    }

    await finalizePostAuthInvite(admin, user.id)
    return finishRedirect(origin, next, sessionCookies)
  }

  if (intent === 'signup') {
    const verifiedInvite =
      request.cookies.get(VERIFIED_INVITE_COOKIE)?.value ??
      (typeof user.user_metadata?.invite_code === 'string'
        ? user.user_metadata.invite_code
        : undefined)
    if (verifiedInvite) {
      await applyInviteToProfile(admin, user.id, verifiedInvite)
    }

    const access = await checkUserInviteAccess(user.id, admin)
    if (!access.hasAccess) {
      return signupRedirect(origin, 'invite_required', sessionCookies)
    }

    await finalizePostAuthInvite(admin, user.id)
    return finishRedirect(origin, next, sessionCookies)
  }

  const access = await checkUserInviteAccess(user.id, admin)
  if (!access.hasAccess) {
    return signupRedirect(origin, 'invite_required', sessionCookies)
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

  return finishRedirect(origin, redirectPath, sessionCookies)
}

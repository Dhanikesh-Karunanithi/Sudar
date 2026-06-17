import type { User } from '@supabase/supabase-js'
import type { NextResponse } from 'next/server'

import { applyInviteToProfile, finalizePostAuthInvite, processOrgInvites } from './authCallback'
import { AUTH_INTENT_PARAM, isNewAuthUser, parseAuthIntent, safeNextPath } from './authIntent'
import { checkUserInviteAccess } from './requireInvite'
import type { AccessSupabaseClient } from './types'
import { VERIFIED_INVITE_COOKIE } from './constants'

export type PostOAuthInput = {
  user: User
  intent: ReturnType<typeof parseAuthIntent>
  next: string
  verifiedInviteCookie?: string
  admin: AccessSupabaseClient
  onboardingRedirect?: (userId: string) => Promise<string | null>
}

export type PostOAuthResult =
  | { kind: 'redirect'; path: string }
  | { kind: 'login_error'; code: 'no_registered_account' | 'invite_required' | 'auth_callback_failed'; signOut?: boolean }
  | { kind: 'signup_error'; code: 'invite_required' }

export async function resolvePostOAuthRedirect(
  input: PostOAuthInput
): Promise<PostOAuthResult> {
  const { user, intent, next, verifiedInviteCookie, admin, onboardingRedirect } = input

  if (user.email) {
    await processOrgInvites(admin, user.id, user.email)
  }

  if (intent === 'login') {
    if (isNewAuthUser(user)) {
      return { kind: 'login_error', code: 'no_registered_account', signOut: true }
    }

    const access = await checkUserInviteAccess(user.id, admin)
    if (!access.hasAccess) {
      return { kind: 'login_error', code: 'invite_required', signOut: true }
    }

    await finalizePostAuthInvite(admin, user.id)
    return { kind: 'redirect', path: next }
  }

  if (intent === 'signup') {
    const verifiedInvite =
      verifiedInviteCookie ??
      (typeof user.user_metadata?.invite_code === 'string'
        ? user.user_metadata.invite_code
        : undefined)

    if (verifiedInvite) {
      await applyInviteToProfile(admin, user.id, verifiedInvite)
    }

    const access = await checkUserInviteAccess(user.id, admin)
    if (!access.hasAccess) {
      return { kind: 'signup_error', code: 'invite_required' }
    }

    await finalizePostAuthInvite(admin, user.id)
    return { kind: 'redirect', path: next }
  }

  const access = await checkUserInviteAccess(user.id, admin)
  if (!access.hasAccess) {
    return { kind: 'login_error', code: 'invite_required', signOut: true }
  }

  await finalizePostAuthInvite(admin, user.id)

  let redirectPath = next
  if (onboardingRedirect) {
    const onboardingPath = await onboardingRedirect(user.id)
    if (onboardingPath) redirectPath = onboardingPath
  }

  return { kind: 'redirect', path: redirectPath }
}

export function loginErrorPath(code: PostOAuthResult & { kind: 'login_error' }): string {
  return `/login?error=${code.code}`
}

export function signupErrorPath(code: 'invite_required'): string {
  return `/signup?error=${code}`
}

export function deleteInviteCookie(response: NextResponse) {
  response.cookies.delete(VERIFIED_INVITE_COOKIE)
}

export function readAuthCallbackParams(searchParams: URLSearchParams) {
  return {
    code: searchParams.get('code'),
    oauthError: searchParams.get('error'),
    oauthErrorDescription: searchParams.get('error_description'),
    next: safeNextPath(searchParams.get('next') ?? '/'),
    intent: parseAuthIntent(searchParams.get(AUTH_INTENT_PARAM)),
  }
}

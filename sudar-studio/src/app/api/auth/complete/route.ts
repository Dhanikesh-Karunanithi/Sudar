import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

import {
  AUTH_INTENT_PARAM,
  deleteInviteCookie,
  loginErrorPath,
  parseAuthIntent,
  resolvePostOAuthRedirect,
  safeNextPath,
  signupErrorPath,
  VERIFIED_INVITE_COOKIE,
} from '@shared-access'
import type { AccessSupabaseClient } from '@shared-access/types'
import { createClient, createServiceRoleSupabaseClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.redirect(new URL('/login?error=auth_callback_failed', request.url))
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
    verifiedInviteCookie: cookieStore.get(VERIFIED_INVITE_COOKIE)?.value,
    admin,
  })

  if (result.kind === 'login_error') {
    if (result.signOut) {
      await supabase.auth.signOut()
    }
    const response = NextResponse.redirect(new URL(loginErrorPath(result), request.url))
    deleteInviteCookie(response)
    return response
  }

  if (result.kind === 'signup_error') {
    const response = NextResponse.redirect(new URL(signupErrorPath(result.code), request.url))
    deleteInviteCookie(response)
    return response
  }

  const response = NextResponse.redirect(new URL(result.path, request.url))
  deleteInviteCookie(response)
  return response
}

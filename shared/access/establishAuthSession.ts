import type { EmailOtpType, SupabaseClient } from '@supabase/supabase-js'

const OTP_TYPES = new Set<string>([
  'signup',
  'invite',
  'magiclink',
  'recovery',
  'email_change',
  'email',
])

export type AuthCallbackParams = {
  code: string | null
  tokenHash: string | null
  otpType: string | null
  oauthError: string | null
}

export function parseAuthCallbackSearchParams(
  searchParams: URLSearchParams | null | undefined
): AuthCallbackParams {
  if (!searchParams) {
    return { code: null, tokenHash: null, otpType: null, oauthError: null }
  }
  return {
    code: searchParams.get('code'),
    tokenHash: searchParams.get('token_hash'),
    otpType: searchParams.get('type'),
    oauthError: searchParams.get('error'),
  }
}

export async function establishSessionFromAuthCallback(
  supabase: SupabaseClient,
  params: AuthCallbackParams
): Promise<{ ok: true } | { ok: false }> {
  if (params.oauthError) {
    return { ok: false }
  }

  if (params.tokenHash && params.otpType && OTP_TYPES.has(params.otpType)) {
    const { error } = await supabase.auth.verifyOtp({
      token_hash: params.tokenHash,
      type: params.otpType as EmailOtpType,
    })
    return error ? { ok: false } : { ok: true }
  }

  if (params.code) {
    const { error } = await supabase.auth.exchangeCodeForSession(params.code)
    return error ? { ok: false } : { ok: true }
  }

  return { ok: false }
}

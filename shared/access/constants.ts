export const AUTH_LOGIN_ERRORS = {
  auth_callback_failed: 'We could not complete sign-in. Please try again or use a different method.',
  session_expired: 'Your session expired. Please sign in again.',
  no_registered_account:
    'No Sudar account is registered for that Google email. Create an account with an invite code to get started.',
  invite_required:
    'That account does not have early access yet. Sign up with an invite code or contact your administrator.',
} as const

export type AuthLoginErrorCode = keyof typeof AUTH_LOGIN_ERRORS

export function resolveAuthLoginError(code: string | null | undefined): string | null {
  if (!code) return null
  return AUTH_LOGIN_ERRORS[code as AuthLoginErrorCode] ?? null
}

export const VERIFIED_INVITE_COOKIE = 'sudar_verified_invite'

export const VERIFIED_INVITE_MAX_AGE_SECONDS = 600

export const ORG_PROVISIONED_CODE = 'ORG_PROVISIONED'

export const ORG_INVITE_CODE = 'ORG_INVITE'

export const GRANDFATHERED_CODE = 'GRANDFATHERED'

export const EARLY_ACCESS_PUBLIC_API_PREFIXES = [
  '/api/invite/validate',
  '/api/invite/prepare-oauth',
  '/api/invite/clear-oauth-prep',
  '/api/invite/apply-profile',
  '/api/invite/redeem',
  '/api/waitlist',
] as const

export function isEarlyAccessPublicApiPath(pathname: string): boolean {
  return EARLY_ACCESS_PUBLIC_API_PREFIXES.some((p) => pathname.startsWith(p))
}

export function isEarlyAccessEnabled(): boolean {
  return process.env.EARLY_ACCESS_ENABLED === 'true'
}

/** Persistent top-of-app Early Access notice (Learn + Studio). Off only when explicitly `false`. */
export function isEarlyAccessBannerEnabled(): boolean {
  return process.env.NEXT_PUBLIC_EARLY_ACCESS_BANNER !== 'false'
}

export const EARLY_ACCESS_BANNER_COPY = {
  subtitle: 'Working prototype for demonstration. Some features are experimental.',
} as const

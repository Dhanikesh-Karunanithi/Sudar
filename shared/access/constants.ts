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

/**
 * Paths on Sudar Learn that must be reachable without a Supabase browser session.
 * Used by middleware so ALP (integration keys / signed embed) and auth callbacks work.
 */
const PUBLIC_PREFIXES = [
  '/login',
  '/signup',
  '/signup/waitlist',
  '/forgot-password',
  '/auth/callback',
  '/api/notifications/unsubscribe',
  '/api/notifications/track',
  '/api/alp/',
  '/api/internal/',
  '/api/cron/',
  '/api/invite/validate',
  '/api/invite/prepare-oauth',
  '/api/invite/clear-oauth-prep',
  '/api/invite/apply-profile',
  '/api/invite/redeem',
  '/api/waitlist',
] as const

/**
 * Returns true when the pathname should skip the "redirect unauthenticated users to /login" gate.
 * Route handlers must still enforce ALP keys, embed tokens, or session auth.
 */
export function isLearnPublicPath(pathname: string): boolean {
  for (const p of PUBLIC_PREFIXES) {
    if (pathname.startsWith(p)) return true
  }
  if (pathname === '/alp/embed' || pathname.startsWith('/alp/embed/')) return true
  return false
}

/**
 * API routes that skip the middleware session gate; handlers must enforce auth
 * (e.g. HttpOnly cookie + HMAC) because iframe navigations may not send Supabase cookies.
 */
export function isLearnApiDelegatedAuthPath(pathname: string): boolean {
  return pathname.startsWith('/api/ai/generate-video/render/')
}

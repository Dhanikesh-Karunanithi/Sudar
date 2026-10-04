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
  '/api/auth/complete',
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
export function isLearnApiDelegatedAuthPath(pathname: string, headers?: Headers): boolean {
  if (pathname.startsWith('/api/ai/generate-video/render/')) return true
  // sudar-sim voice agent calls server-to-server with X-Sudar-Sim-Secret (no cookie); both handlers
  // verify the secret themselves, and the session route falls back to cookie auth without it.
  if (/^\/api\/sim\/session\/[^/]+\/agent$/.test(pathname)) return true
  if (/^\/api\/sim\/session\/[^/]+$/.test(pathname) && headers?.get('x-sudar-sim-secret')) return true
  return false
}

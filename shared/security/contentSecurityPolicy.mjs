/**
 * Shared CSP for Sudar Learn / Studio (Next.js headers).
 * Cloudflare injects Web Analytics; course personas load Google Fonts CSS.
 */
export function sudarContentSecurityPolicy() {
  return [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://static.cloudflareinsights.com",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' data: https://fonts.gstatic.com https://fonts.googleapis.com",
    "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://static.cloudflareinsights.com https://cloudflareinsights.com https://api.together.xyz https://api.openai.com https://api.anthropic.com",
    "img-src 'self' data: https: blob:",
    "frame-ancestors 'self'",
  ].join('; ')
}

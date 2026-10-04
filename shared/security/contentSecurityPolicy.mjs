/**
 * Shared CSP for Sudar Learn / Studio (Next.js headers).
 * Cloudflare injects Web Analytics; course personas load Google Fonts CSS.
 * Evaluated when next.config loads, so env-derived origins must be present at build time.
 */

const LIVEKIT_CLOUD = ['wss://*.livekit.cloud', 'https://*.livekit.cloud']
const DEV_LOCAL = ['ws://localhost:*', 'http://localhost:*', 'ws://127.0.0.1:*', 'http://127.0.0.1:*']

/** Browser-reachable origins for self-hosted LiveKit / SudarSim (e.g. wss://livekit.example.com). */
function extraRealtimeOrigins(env) {
  const raw = [env.NEXT_PUBLIC_LIVEKIT_URL, env.LIVEKIT_PUBLIC_URL, env.CSP_EXTRA_CONNECT_SRC]
    .filter(Boolean)
    .join(' ')
  const out = new Set()
  for (const token of raw.split(/[\s,]+/)) {
    if (!token) continue
    try {
      const url = new URL(token)
      out.add(`${url.protocol}//${url.host}`)
      if (url.protocol === 'wss:') out.add(`https://${url.host}`)
      if (url.protocol === 'https:') out.add(`wss://${url.host}`)
    } catch {
      // Ignore malformed values rather than emitting an invalid policy.
    }
  }
  return [...out]
}

/** Browser error reports post to the Sentry ingest host embedded in NEXT_PUBLIC_SENTRY_DSN. */
function sentryOrigins(env) {
  const dsn = env.NEXT_PUBLIC_SENTRY_DSN?.trim()
  if (!dsn) return []
  try {
    const url = new URL(dsn)
    return url.protocol === 'https:' ? [`https://${url.host}`] : []
  } catch {
    return []
  }
}

export function sudarContentSecurityPolicy(env = process.env) {
  const isDev = env.NODE_ENV !== 'production'
  const connect = [
    "'self'",
    'https://*.supabase.co',
    'wss://*.supabase.co',
    'https://*.thesudar.com',
    'wss://*.thesudar.com',
    'https://static.cloudflareinsights.com',
    'https://cloudflareinsights.com',
    'https://api.together.xyz',
    'https://api.openai.com',
    'https://api.anthropic.com',
    ...LIVEKIT_CLOUD,
    ...extraRealtimeOrigins(env),
    ...sentryOrigins(env),
    ...(isDev ? DEV_LOCAL : []),
  ]
  return [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://static.cloudflareinsights.com",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' data: https://fonts.gstatic.com https://fonts.googleapis.com",
    `connect-src ${connect.join(' ')}`,
    "img-src 'self' data: https: blob:",
    "media-src 'self' data: blob: https:",
    "worker-src 'self' blob:",
    "frame-src 'self' https://www.youtube.com https://www.youtube-nocookie.com https://player.vimeo.com https:",
    "frame-ancestors 'self'",
  ].join('; ')
}

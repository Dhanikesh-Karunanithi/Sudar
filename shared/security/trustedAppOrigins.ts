/**
 * Canonical Sudar app origins for same-origin / CSRF guards.
 * Production lives on Cloudflare (thesudar.com); Vercel hosts staging fallbacks.
 */
export const SUDAR_PRODUCTION_ORIGINS = [
  'https://learn.thesudar.com',
  'https://studio.thesudar.com',
] as const

export const SUDAR_STAGING_ORIGINS = [
  'https://sudar-learn.vercel.app',
  'https://sudar-studio.vercel.app',
] as const

function originFromUrl(value: string | undefined): string | null {
  if (!value?.trim()) return null
  try {
    return new URL(value.trim()).origin
  } catch {
    return null
  }
}

/** Build the allowlist for browser Origin checks on mutating API routes. */
export function collectTrustedOrigins(
  requestOrigin: string | undefined,
  envUrlKeys: readonly string[],
): Set<string> {
  const origins = new Set<string>()

  if (requestOrigin) origins.add(requestOrigin)

  for (const origin of [...SUDAR_PRODUCTION_ORIGINS, ...SUDAR_STAGING_ORIGINS]) {
    origins.add(origin)
  }

  for (const key of envUrlKeys) {
    const fromEnv = originFromUrl(process.env[key])
    if (fromEnv) origins.add(fromEnv)
  }

  const extra = process.env.TRUSTED_APP_ORIGINS?.split(',') ?? []
  for (const part of extra) {
    const fromExtra = originFromUrl(part)
    if (fromExtra) origins.add(fromExtra)
  }

  return origins
}

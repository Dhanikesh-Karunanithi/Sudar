/**
 * SudarNotes (Sudar 2.0 experiment) — gate for nav + /journey route.
 * Explicit false/0 always off. Explicit true/1 always on.
 * When unset: on in development so the experiment is demoable locally;
 * off in production until operators set NEXT_PUBLIC_SUDAR_JOURNEY=1.
 */
export function isJourneyEnabled(): boolean {
  const raw = process.env.NEXT_PUBLIC_SUDAR_JOURNEY?.trim().toLowerCase()
  if (raw === '0' || raw === 'false') return false
  if (raw === '1' || raw === 'true') return true
  return process.env.NODE_ENV === 'development'
}

/**
 * Allowlist for URLs that may appear in tutor media/resource blocks.
 * Blocks javascript:, data: (non-image), and non-http(s) schemes.
 */
export function isSafeTutorHttpUrl(raw: string | undefined | null): boolean {
  if (!raw || typeof raw !== 'string') return false
  const t = raw.trim()
  if (t.length > 2048) return false
  let u: URL
  try {
    u = new URL(t)
  } catch {
    return false
  }
  if (u.protocol !== 'http:' && u.protocol !== 'https:') return false
  const host = u.hostname.toLowerCase()
  if (host === 'localhost' || host === '0.0.0.0' || host.endsWith('.local')) return false
  // Block obvious IP literals in private ranges (basic; SSRF for page fetch is separate)
  if (/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(host)) {
    const [a, b] = host.split('.').map((n) => Number(n))
    if (a === 10 || a === 127 || (a === 192 && b === 168) || (a === 172 && b >= 16 && b <= 31)) return false
  }
  return true
}

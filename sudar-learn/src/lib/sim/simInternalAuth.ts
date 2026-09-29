import { timingSafeEqual } from 'crypto'

/** Verify sudar-sim service secret for agent → Learn internal calls. */
export function verifySimServiceSecret(header: string | null): boolean {
  const expected = process.env.SUDAR_SIM_SERVICE_SECRET?.trim()
  if (!expected) {
    if (process.env.NODE_ENV === 'production') return false
    return Boolean(header?.trim())
  }
  const provided = header?.trim() ?? ''
  if (!provided || provided.length !== expected.length) return false
  try {
    return timingSafeEqual(Buffer.from(provided), Buffer.from(expected))
  } catch {
    return false
  }
}

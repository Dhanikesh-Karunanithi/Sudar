import { timingSafeEqual } from 'crypto'

/**
 * Verify sudar-sim service secret for agent → Learn internal calls.
 * Fails closed in every environment: set SUDAR_SIM_SERVICE_SECRET in both Learn and sudar-sim.
 */
export function verifySimServiceSecret(header: string | null): boolean {
  const expected = process.env.SUDAR_SIM_SERVICE_SECRET?.trim()
  if (!expected) return false
  const provided = header?.trim() ?? ''
  if (!provided || provided.length !== expected.length) return false
  try {
    return timingSafeEqual(Buffer.from(provided), Buffer.from(expected))
  } catch {
    return false
  }
}

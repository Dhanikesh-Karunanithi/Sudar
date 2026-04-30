import { timingSafeEqual } from 'crypto'
import { NextRequest } from 'next/server'

/**
 * Validates Sudar Intelligence (or other backend) calling Learn agent-tool routes.
 */
export function verifyIntelligenceServiceRequest(request: NextRequest): boolean {
  const expected = process.env.INTELLIGENCE_SERVICE_SECRET?.trim()
  if (!expected) return false
  const header = request.headers.get('x-intelligence-service-secret')?.trim() ?? ''
  const auth =
    request.headers.get('authorization')?.replace(/^Bearer\s+/i, '').trim() ?? ''
  const buf = (s: string) => Buffer.from(s)
  if (header) {
    try {
      return header.length === expected.length && timingSafeEqual(buf(header), buf(expected))
    } catch {
      return false
    }
  }
  if (auth) {
    try {
      return auth.length === expected.length && timingSafeEqual(buf(auth), buf(expected))
    } catch {
      return false
    }
  }
  return false
}

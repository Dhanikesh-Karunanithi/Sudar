import { timingSafeEqual } from 'crypto'
import { NextRequest } from 'next/server'

function secretsMatch(actual: string, expected: string): boolean {
  const actualBuffer = Buffer.from(actual)
  const expectedBuffer = Buffer.from(expected)
  return actualBuffer.length === expectedBuffer.length && timingSafeEqual(actualBuffer, expectedBuffer)
}

/** Validates Studio/cron callers using INTERNAL_SERVICE_SECRET. */
export function verifyInternalServiceRequest(request: NextRequest): boolean {
  const expected = process.env.INTERNAL_SERVICE_SECRET?.trim()
  if (!expected) return false
  const auth = request.headers.get('authorization')?.replace(/^Bearer\s+/i, '').trim() ?? ''
  if (!auth) return false
  try {
    return secretsMatch(auth, expected)
  } catch {
    return false
  }
}

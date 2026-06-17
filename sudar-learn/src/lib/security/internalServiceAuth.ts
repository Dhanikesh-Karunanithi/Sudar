import type { NextRequest } from 'next/server'

/** True when Authorization: Bearer matches INTERNAL_SERVICE_SECRET. */
export function authorizeInternalService(request: NextRequest): boolean {
  const secret = process.env.INTERNAL_SERVICE_SECRET?.trim()
  if (!secret) return false
  const auth = request.headers.get('authorization') ?? ''
  return auth === `Bearer ${secret}`
}

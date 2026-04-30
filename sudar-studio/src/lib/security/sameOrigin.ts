import { NextRequest, NextResponse } from 'next/server'

function allowedOrigins(request: NextRequest): Set<string> {
  const origins = new Set<string>()
  const requestOrigin = request.nextUrl.origin
  if (requestOrigin) origins.add(requestOrigin)

  for (const value of [
    process.env.NEXT_PUBLIC_APP_URL,
    process.env.NEXTAUTH_URL,
    process.env.NEXT_PUBLIC_STUDIO_APP_URL,
  ]) {
    if (!value?.trim()) continue
    try {
      origins.add(new URL(value).origin)
    } catch {
      // Ignore malformed optional env values.
    }
  }

  return origins
}

export function rejectCrossSiteRequest(request: NextRequest): NextResponse | null {
  const fetchSite = request.headers.get('sec-fetch-site')
  if (fetchSite === 'cross-site') {
    return NextResponse.json({ error: 'Cross-site requests are not allowed' }, { status: 403 })
  }

  const origin = request.headers.get('origin')
  if (!origin) return null

  if (!allowedOrigins(request).has(origin)) {
    return NextResponse.json({ error: 'Invalid request origin' }, { status: 403 })
  }

  return null
}

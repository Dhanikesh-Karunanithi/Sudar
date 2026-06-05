import { NextRequest, NextResponse } from 'next/server'

import { collectTrustedOrigins } from '../../../../shared/security/trustedAppOrigins'

function allowedOrigins(request: NextRequest): Set<string> {
  return collectTrustedOrigins(request.nextUrl.origin, [
    'NEXT_PUBLIC_APP_URL',
    'NEXTAUTH_URL',
    'NEXT_PUBLIC_STUDIO_APP_URL',
    'NEXT_PUBLIC_LEARN_APP_URL',
  ])
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

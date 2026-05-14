import { timingSafeEqual } from 'crypto'
import { NextRequest, NextResponse } from 'next/server'

function extractCronSecret(request: NextRequest): string {
  return (
    request.headers.get('authorization')?.replace(/^Bearer\s+/i, '').trim() ??
    request.nextUrl.searchParams.get('secret')?.trim() ??
    ''
  )
}

function secretsMatch(actual: string, expected: string): boolean {
  const actualBuffer = Buffer.from(actual)
  const expectedBuffer = Buffer.from(expected)
  return actualBuffer.length === expectedBuffer.length && timingSafeEqual(actualBuffer, expectedBuffer)
}

function configuredCronSecret(): string {
  return process.env.CRON_SECRET?.trim() || process.env.LEARN_CRON_SECRET?.trim() || ''
}

export function rejectInvalidCronRequest(request: NextRequest): NextResponse | null {
  const configuredSecret = configuredCronSecret()
  if (!configuredSecret) {
    return NextResponse.json(
      { error: 'CRON_SECRET (or LEARN_CRON_SECRET) is not configured' },
      { status: 503 },
    )
  }

  if (!secretsMatch(extractCronSecret(request), configuredSecret)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  return null
}

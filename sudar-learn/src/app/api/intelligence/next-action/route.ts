/**
 * Next Best Action Engine — thin route; core logic in `@/lib/intelligence/nextBestActionEngine`.
 */

import { createServiceRoleSupabaseClient } from '@/lib/supabase/server'
import { getRequestSession } from '@/lib/auth/requestSession'
import { NextRequest, NextResponse } from 'next/server'
import { checkAndIncrementUsage } from '@/lib/usage-limits'
import { computeNextBestActionForUser } from '@/lib/intelligence/nextBestActionEngine'

export async function POST(request: NextRequest) {
  const session = await getRequestSession(request)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { user } = session

  const admin = createServiceRoleSupabaseClient()
  const usage = await checkAndIncrementUsage(admin, user.id, 'next_action')
  if (!usage.allowed) {
    return NextResponse.json(
      { error: `Daily next-action limit (${usage.limit}) reached. Try again tomorrow.` },
      { status: 429 },
    )
  }

  const body = await request.json().catch(() => ({}))
  const force = body.force === true

  const result = await computeNextBestActionForUser(admin, user.id, { force })
  if ('skipped' in result && result.skipped === 'no_profile') {
    return NextResponse.json({ ok: true, skipped: 'no profile' })
  }
  if ('skipped' in result && result.skipped === 'fresh') {
    return NextResponse.json({ ok: true, skipped: 'fresh', action: result.action })
  }
  return NextResponse.json({ ok: true, action: 'action' in result ? result.action : undefined })
}

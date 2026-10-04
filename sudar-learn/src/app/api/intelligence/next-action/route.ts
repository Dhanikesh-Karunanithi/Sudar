/**
 * Next Best Action Engine — thin route; core logic in `@/lib/intelligence/nextBestActionEngine`.
 */

import { createServiceRoleSupabaseClient } from '@/lib/supabase/server'
import { getRequestSession } from '@/lib/auth/requestSession'
import { NextRequest, NextResponse } from 'next/server'
import { checkAndIncrementUsage, usageLimitErrorResponse } from '@/lib/usage-limits'
import {
  computeNextBestActionForUser,
  NEXT_BEST_ACTION_STALE_HOURS,
} from '@/lib/intelligence/nextBestActionEngine'

export async function POST(request: NextRequest) {
  const session = await getRequestSession(request)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { user } = session

  const body = await request.json().catch(() => ({}))
  const force = body.force === true

  const admin = createServiceRoleSupabaseClient()

  // Cheap freshness check before burning usage quota or heavy queries
  if (!force) {
    const { data: profile } = await admin
      .from('learner_profiles')
      .select('next_best_action')
      .eq('user_id', user.id)
      .maybeSingle()

    if (!profile) {
      return NextResponse.json({ ok: true, skipped: 'no profile' })
    }

    const existing = profile.next_best_action as Record<string, unknown> | null
    if (existing?.computed_at) {
      const ageHours = (Date.now() - new Date(existing.computed_at as string).getTime()) / 3600000
      if (ageHours < NEXT_BEST_ACTION_STALE_HOURS) {
        return NextResponse.json({ ok: true, skipped: 'fresh', action: existing })
      }
    }
  }

  const usage = await checkAndIncrementUsage(admin, user.id, 'next_action')
  if (!usage.allowed) {
    const err = usageLimitErrorResponse(usage)
    return NextResponse.json(err.body, { status: err.status })
  }

  const result = await computeNextBestActionForUser(admin, user.id, { force })
  if ('skipped' in result && result.skipped === 'no_profile') {
    return NextResponse.json({ ok: true, skipped: 'no profile' })
  }
  if ('skipped' in result && result.skipped === 'fresh') {
    return NextResponse.json({ ok: true, skipped: 'fresh', action: result.action })
  }
  return NextResponse.json({ ok: true, action: 'action' in result ? result.action : undefined })
}

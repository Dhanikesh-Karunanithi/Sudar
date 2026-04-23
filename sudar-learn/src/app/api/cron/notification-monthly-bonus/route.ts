import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { runMonthlyNotificationBonuses } from '../../../../../../../shared/notifications/guardrails'

export async function POST(request: NextRequest) {
  const secret = request.headers.get('authorization')?.replace(/^Bearer\s+/i, '') ?? request.nextUrl.searchParams.get('secret')
  if (process.env.CRON_SECRET && secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const admin = createAdminClient()
  await runMonthlyNotificationBonuses(admin)
  return NextResponse.json({ ok: true })
}

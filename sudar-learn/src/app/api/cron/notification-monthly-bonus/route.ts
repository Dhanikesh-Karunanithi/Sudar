import { NextRequest, NextResponse } from 'next/server'
import { createServiceRoleSupabaseClient } from '@/lib/supabase/server'
import { rejectInvalidCronRequest } from '@/lib/security/cronAuth'
import { runMonthlyNotificationBonuses } from '../../../../../../shared/notifications/guardrails'

export async function POST(request: NextRequest) {
  const cronError = rejectInvalidCronRequest(request)
  if (cronError) return cronError

  const admin = createServiceRoleSupabaseClient()
  await runMonthlyNotificationBonuses(admin)
  return NextResponse.json({ ok: true })
}

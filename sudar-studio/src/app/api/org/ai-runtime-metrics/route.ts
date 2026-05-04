import { createServiceRoleSupabaseClient, createClient } from '@/lib/supabase/server'
import { requireOrgAdmin } from '@/lib/org'
import { NextResponse } from 'next/server'

const EVENT_TYPES = ['ai_runtime_route', 'ai_runtime_fallback', 'ai_runtime_failure'] as const

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let orgId: string
  try {
    orgId = await requireOrgAdmin(user.id)
  } catch {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const admin = createServiceRoleSupabaseClient()
  const { data: users } = await admin.from('profiles').select('id').eq('org_id', orgId)
  const userIds = (users ?? []).map((u) => u.id)
  if (userIds.length === 0) {
    return NextResponse.json({
      success: true,
      data: { totals: { ai_runtime_route: 0, ai_runtime_fallback: 0, ai_runtime_failure: 0 } },
    })
  }

  const sinceIso = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
  const totals: Record<string, number> = {}
  for (const eventType of EVENT_TYPES) {
    const { count } = await admin
      .from('learning_events')
      .select('id', { count: 'exact', head: true })
      .in('user_id', userIds)
      .eq('event_type', eventType)
      .gte('created_at', sinceIso)
    totals[eventType] = count ?? 0
  }

  return NextResponse.json({
    success: true,
    data: {
      window_days: 7,
      totals,
      fallback_ratio:
        totals.ai_runtime_route > 0 ? Number((totals.ai_runtime_fallback / totals.ai_runtime_route).toFixed(4)) : 0,
    },
  })
}


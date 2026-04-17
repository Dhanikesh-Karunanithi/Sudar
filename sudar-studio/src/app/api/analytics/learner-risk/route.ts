import { NextResponse } from 'next/server'
import { createAdminClient, createClient } from '@/lib/supabase/server'
import { getOrCreateOrg } from '@/lib/org'

export async function GET() {
  if (process.env.ENABLE_ANALYTICS_ENGINE === 'false') {
    return NextResponse.json({ success: false, error: 'Analytics engine disabled' }, { status: 503 })
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })

  const orgId = await getOrCreateOrg(user.id)
  const admin = createAdminClient()
  const today = new Date().toISOString().slice(0, 10)

  const { data: riskRows, error } = await admin
    .from('analytics_risk_signals')
    .select('user_id, risk_score, risk_level, reasons, focus_ratio_7d, completion_velocity_7d, drop_off_count_7d, last_active_at')
    .eq('org_id', orgId)
    .eq('as_of_date', today)
    .order('risk_score', { ascending: false })

  if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 })

  const userIds = [...new Set((riskRows ?? []).map((r) => r.user_id))]
  const { data: profiles } = userIds.length
    ? await admin.from('profiles').select('id, full_name').in('id', userIds)
    : { data: [] as Array<{ id: string; full_name: string | null }> }

  const profileMap = new Map((profiles ?? []).map((p) => [p.id, p.full_name ?? 'Unknown learner']))

  return NextResponse.json({
    success: true,
    data: (riskRows ?? []).map((row) => ({
      ...row,
      full_name: profileMap.get(row.user_id) ?? 'Unknown learner',
      reasons: Array.isArray(row.reasons) ? row.reasons.filter(Boolean) : [],
    })),
  })
}

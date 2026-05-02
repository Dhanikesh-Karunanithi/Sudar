import { createClient, createServiceRoleSupabaseClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const admin = createServiceRoleSupabaseClient()

  const [profileRes, ledgerRes] = await Promise.all([
    admin
      .from('learner_profiles')
      .select('coin_balance, xp_total, scholar_level, scholar_title, profile_completeness_pct, total_checkins_answered')
      .eq('user_id', user.id)
      .single(),
    admin
      .from('coin_ledger')
      .select('amount, event_type, balance_after, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(20),
  ])

  return NextResponse.json({
    success: true,
    data: {
      balance: profileRes.data?.coin_balance ?? 0,
      xp: profileRes.data?.xp_total ?? 0,
      level: profileRes.data?.scholar_level ?? 1,
      title: profileRes.data?.scholar_title ?? 'Seeker',
      profileCompleteness: profileRes.data?.profile_completeness_pct ?? 0,
      totalCheckins: profileRes.data?.total_checkins_answered ?? 0,
      recentTransactions: ledgerRes.data ?? [],
    },
  })
}

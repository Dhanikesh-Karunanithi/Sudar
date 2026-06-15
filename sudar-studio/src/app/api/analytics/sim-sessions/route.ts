import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

/** Org team SudarSim analytics — session scores summary */
export async function GET() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const admin = (await import('@/lib/supabase/server')).createServiceRoleSupabaseClient()
  const { data: profile } = await admin.from('profiles').select('org_id, role').eq('id', user.id).single()
  if (!profile?.org_id) return NextResponse.json({ error: 'No org' }, { status: 403 })

  const { data: sessions } = await admin
    .from('sim_sessions')
    .select('id, user_id, scenario_id, status, started_at, sim_rubric_results(overall_score, passed)')
    .eq('org_id', profile.org_id)
    .order('started_at', { ascending: false })
    .limit(100)

  return NextResponse.json({ success: true, sessions: sessions ?? [] })
}

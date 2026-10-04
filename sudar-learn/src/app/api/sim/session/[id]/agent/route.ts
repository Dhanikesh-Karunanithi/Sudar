import { NextRequest, NextResponse } from 'next/server'
import { createServiceRoleSupabaseClient } from '@/lib/supabase/server'
import { verifySimServiceSecret } from '@/lib/sim/simInternalAuth'

type RouteParams = { params: Promise<{ id: string }> }

/** Agent-only: load session context without learner JWT. */
export async function GET(request: NextRequest, { params }: RouteParams) {
  if (!verifySimServiceSecret(request.headers.get('x-sudar-sim-secret'))) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params
  const userId = request.nextUrl.searchParams.get('user_id')
  if (!userId) {
    return NextResponse.json({ success: false, error: 'user_id required' }, { status: 400 })
  }

  const admin = createServiceRoleSupabaseClient()
  const { data: session } = await admin
    .from('sim_sessions')
    .select('*, sim_scenarios(*)')
    .eq('id', id)
    .eq('user_id', userId)
    .single()

  if (!session) {
    return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 })
  }

  const scenario = session.sim_scenarios as Record<string, unknown> | null
  const { data: transcript } = await admin.from('sim_transcripts').select('turns').eq('session_id', id).single()

  return NextResponse.json({
    success: true,
    session_id: id,
    scenario_id: session.scenario_id,
    persona_state: session.persona_state,
    scenario: scenario
      ? {
          id: scenario.id,
          title: scenario.title,
          locale: scenario.locale,
          persona: scenario.persona,
          channels: scenario.channels,
          channel_config: scenario.channel_config,
          rubric: scenario.rubric,
        }
      : null,
    transcript: transcript?.turns ?? [],
  })
}

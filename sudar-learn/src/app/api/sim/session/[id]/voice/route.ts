import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceRoleSupabaseClient } from '@/lib/supabase/server'
import { joinVoiceRoom } from '@/lib/sim/simSession'

type RouteParams = { params: Promise<{ id: string }> }

/** Learner: refresh LiveKit join token for an active session. */
export async function POST(_request: NextRequest, { params }: RouteParams) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const admin = createServiceRoleSupabaseClient()
  const { data: session } = await admin
    .from('sim_sessions')
    .select('livekit_room, status')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (!session?.livekit_room) {
    return NextResponse.json({ success: false, error: 'No voice room for session' }, { status: 404 })
  }

  try {
    const voice = await joinVoiceRoom(id, user.id, session.livekit_room)
    return NextResponse.json({ success: true, voice })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Voice join failed'
    return NextResponse.json({ success: false, error: message }, { status: 503 })
  }
}

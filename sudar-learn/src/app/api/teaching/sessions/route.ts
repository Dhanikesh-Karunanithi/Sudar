import { createClient, createServiceRoleSupabaseClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import {
  createLearningSession,
  getLearningSession,
  resumeLatestSession,
  updateLearningSessionState,
} from '@/lib/teaching/session'
import { LEARNING_SESSION_SURFACES } from '@/types/teaching'

const createSchema = z.object({
  surface: z.enum(LEARNING_SESSION_SURFACES),
  domain_id: z.string().uuid().nullable().optional(),
  org_id: z.string().uuid().nullable().optional(),
  goal: z.string().max(500).nullable().optional(),
  active_claim_ids: z.array(z.string().uuid()).max(20).optional(),
})

export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })

  const admin = createServiceRoleSupabaseClient()
  const id = request.nextUrl.searchParams.get('id')
  const surface = request.nextUrl.searchParams.get('surface') as
    | (typeof LEARNING_SESSION_SURFACES)[number]
    | null

  if (id) {
    const session = await getLearningSession(admin, id, user.id)
    if (!session) return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 })
    return NextResponse.json({ success: true, data: session })
  }

  const session = await resumeLatestSession(
    admin,
    user.id,
    surface && LEARNING_SESSION_SURFACES.includes(surface) ? surface : undefined,
  )
  return NextResponse.json({ success: true, data: session })
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })

  const parsed = createSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) {
    return NextResponse.json({ success: false, error: 'Invalid body' }, { status: 400 })
  }

  const admin = createServiceRoleSupabaseClient()
  const session = await createLearningSession(admin, {
    userId: user.id,
    orgId: parsed.data.org_id ?? null,
    domainId: parsed.data.domain_id ?? null,
    surface: parsed.data.surface,
    state: {
      goal: parsed.data.goal ?? null,
      active_claim_ids: parsed.data.active_claim_ids ?? [],
      working_memory: {
        goal: parsed.data.goal ?? null,
        active_concept: null,
        open_questions: [],
        known: [],
        gaps: [],
      },
    },
  })
  return NextResponse.json({ success: true, data: session })
}

export async function PATCH(request: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })

  const body = await request.json().catch(() => null)
  const id = typeof body?.id === 'string' ? body.id : null
  if (!id) return NextResponse.json({ success: false, error: 'id required' }, { status: 400 })

  const admin = createServiceRoleSupabaseClient()
  const patch = body?.state
  if (!patch || typeof patch !== 'object') {
    return NextResponse.json({ success: false, error: 'state required' }, { status: 400 })
  }
  const session = await updateLearningSessionState(admin, id, user.id, patch)
  if (!session) return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 })
  return NextResponse.json({ success: true, data: session })
}

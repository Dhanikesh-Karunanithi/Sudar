import { createClient, createServiceRoleSupabaseClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { recordClaimEvidence } from '@/lib/teaching/mastery'

const evidenceTypes = [
  'explain_back',
  'apply',
  'catch_error',
  'quiz',
  'flashcard',
  'sim_coach',
  'teach_back',
  'transfer',
] as const

const bodySchema = z.object({
  claim_id: z.string().uuid(),
  evidence_type: z.enum(evidenceTypes),
  correct: z.boolean().nullable().optional(),
  score: z.number().min(0).max(1).nullable().optional(),
  course_id: z.string().uuid().nullable().optional(),
  module_id: z.string().uuid().nullable().optional(),
  modality: z.string().nullable().optional(),
})

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })

  const parsed = bodySchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) {
    return NextResponse.json({ success: false, error: 'Invalid body' }, { status: 400 })
  }

  const admin = createServiceRoleSupabaseClient()
  try {
    const mastery = await recordClaimEvidence(admin, {
      userId: user.id,
      claimId: parsed.data.claim_id,
      evidence_type: parsed.data.evidence_type,
      correct: parsed.data.correct ?? null,
      score: parsed.data.score ?? null,
      courseId: parsed.data.course_id ?? null,
      moduleId: parsed.data.module_id ?? null,
      modality: parsed.data.modality ?? null,
    })
    return NextResponse.json({ success: true, data: mastery })
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Failed'
    return NextResponse.json({ success: false, error: msg }, { status: 500 })
  }
}

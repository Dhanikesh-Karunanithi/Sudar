import { createClient, createServiceRoleSupabaseClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { claimsForModule } from '@/lib/teaching/claimGraph'
import { loadMasteryForUser, MASTERED_THRESHOLD } from '@/lib/teaching/mastery'
import type { ModuleClaimWithMastery } from '@/types/teaching'

const querySchema = z.object({ module_id: z.string().uuid() })

export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })

  const parsed = querySchema.safeParse({ module_id: request.nextUrl.searchParams.get('module_id') })
  if (!parsed.success) {
    return NextResponse.json({ success: false, error: 'module_id required' }, { status: 400 })
  }
  const moduleId = parsed.data.module_id

  const admin = createServiceRoleSupabaseClient()
  const { data: moduleRow } = await admin
    .from('modules')
    .select('course_id')
    .eq('id', moduleId)
    .maybeSingle()
  if (!moduleRow?.course_id) {
    return NextResponse.json({ success: false, error: 'Module not found' }, { status: 404 })
  }
  const { data: enrollment } = await admin
    .from('enrollments')
    .select('id')
    .eq('user_id', user.id)
    .eq('course_id', moduleRow.course_id)
    .maybeSingle()
  if (!enrollment) {
    return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 })
  }

  try {
    const claims = await claimsForModule(admin, moduleId)
    const mastery = claims.length
      ? await loadMasteryForUser(admin, user.id, claims.map((c) => c.id))
      : []
    const byClaim = new Map(mastery.map((m) => [m.claim_id, m]))
    const data: ModuleClaimWithMastery[] = claims
      .sort((a, b) => a.sort_order - b.sort_order)
      .map((c) => {
        const m = byClaim.get(c.id)
        return {
          id: c.id,
          stem: c.stem,
          bloom: c.bloom,
          p_know: m ? m.p_know : null,
          mastered: m ? m.p_know >= MASTERED_THRESHOLD : false,
          next_review_at: m?.next_review_at ?? null,
        }
      })
    return NextResponse.json({ success: true, data: { claims: data } })
  } catch {
    return NextResponse.json({ success: true, data: { claims: [] } })
  }
}

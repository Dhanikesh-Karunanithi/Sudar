import { createServiceRoleSupabaseClient } from '@/lib/supabase/server'
import { verifyInternalServiceRequest } from '@/lib/security/internalServiceAuth'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { ingestExternalCourseRag } from '@/lib/rag/ingestExternalCourse'

const bodySchema = z.object({
  course_id: z.string().uuid(),
})

export async function POST(request: NextRequest) {
  if (!verifyInternalServiceRequest(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const admin = createServiceRoleSupabaseClient()

  const parsed = bodySchema.safeParse(await request.json().catch(() => ({})))
  if (!parsed.success) return NextResponse.json({ error: 'Invalid body' }, { status: 400 })

  try {
    const result = await ingestExternalCourseRag(admin, parsed.data.course_id)
    return NextResponse.json({ ok: true, ...result })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

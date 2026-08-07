import { createClient, createServiceRoleSupabaseClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { ingestExternalCourseRag } from '@/lib/rag/ingestExternalCourse'
import { userCanEditOrgContent } from '@/lib/org/contentEditor'

const bodySchema = z.object({
  course_id: z.string().uuid(),
})

function authorizeInternal(request: NextRequest): boolean {
  const secret = process.env.INTERNAL_SERVICE_SECRET?.trim()
  if (!secret) return false
  const auth = request.headers.get('authorization') ?? ''
  return auth === `Bearer ${secret}`
}

export async function POST(request: NextRequest) {
  const internal = authorizeInternal(request)
  const admin = createServiceRoleSupabaseClient()

  const parsed = bodySchema.safeParse(await request.json().catch(() => ({})))
  if (!parsed.success) return NextResponse.json({ error: 'Invalid body' }, { status: 400 })

  if (!internal) {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: course } = await admin
      .from('courses')
      .select('org_id, is_external')
      .eq('id', parsed.data.course_id)
      .eq('is_external', true)
      .maybeSingle()

    if (!course?.org_id) {
      return NextResponse.json({ error: 'External course not found' }, { status: 404 })
    }

    const allowed = await userCanEditOrgContent(supabase, user.id, course.org_id as string)
    if (!allowed) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
  }

  try {
    const result = await ingestExternalCourseRag(admin, parsed.data.course_id)
    return NextResponse.json({ ok: true, ...result })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

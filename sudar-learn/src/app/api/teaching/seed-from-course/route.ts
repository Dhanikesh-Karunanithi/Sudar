import { createClient, createServiceRoleSupabaseClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { seedDomainFromCourse } from '@/lib/teaching/seedDomainFromCourse'

const bodySchema = z.object({
  course_id: z.string().uuid(),
  org_id: z.string().uuid().optional(),
  replace_claims: z.boolean().optional(),
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
  const { data: profile } = await admin.from('profiles').select('org_id').eq('id', user.id).maybeSingle()
  const orgId = parsed.data.org_id ?? (profile?.org_id != null ? String(profile.org_id) : null)
  if (!orgId) {
    return NextResponse.json({ success: false, error: 'org_id required' }, { status: 400 })
  }

  try {
    const result = await seedDomainFromCourse(admin, {
      orgId,
      courseId: parsed.data.course_id,
      replaceClaims: parsed.data.replace_claims === true,
    })
    return NextResponse.json({ success: true, data: result })
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Seed failed'
    return NextResponse.json({ success: false, error: msg }, { status: 500 })
  }
}

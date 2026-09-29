import { createClient, createServiceRoleSupabaseClient } from '@/lib/supabase/server'
import { getOrCreateOrg } from '@/lib/org'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { seedDomainFromCourse } from '@/lib/teaching/seedDomainFromCourse'

export async function GET() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const admin = createServiceRoleSupabaseClient()
  const orgId = await getOrCreateOrg(user.id)
  const { data, error } = await admin
    .from('learning_domains')
    .select('id, title, description, source, source_course_id, version, updated_at')
    .eq('org_id', orgId)
    .order('updated_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true, data: data ?? [] })
}

const seedSchema = z.object({
  course_id: z.string().uuid(),
  replace_claims: z.boolean().optional(),
})

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const admin = createServiceRoleSupabaseClient()
  const orgId = await getOrCreateOrg(user.id)
  const parsed = seedSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid body' }, { status: 400 })
  }

  try {
    const result = await seedDomainFromCourse(admin, {
      orgId,
      courseId: parsed.data.course_id,
      replaceClaims: parsed.data.replace_claims === true,
    })
    return NextResponse.json({ success: true, data: result })
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Seed failed' },
      { status: 500 },
    )
  }
}

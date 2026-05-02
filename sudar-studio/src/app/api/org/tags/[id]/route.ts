import { createClient, createServiceRoleSupabaseClient } from '@/lib/supabase/server'
import { requireOrgContentEditor } from '@/lib/org'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { slugifyTagLabel, syncCourseDenormalizedTags } from '@/lib/courseTags'

const patchSchema = z.object({
  label: z.string().min(1).max(120).optional(),
  slug: z.string().min(1).max(120).optional(),
  group_id: z.string().uuid().nullable().optional(),
})

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let orgId: string
  try {
    orgId = await requireOrgContentEditor(user.id)
  } catch {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const json = await request.json().catch(() => null)
  const parsed = patchSchema.safeParse(json)
  if (!parsed.success) return NextResponse.json({ error: 'Invalid body' }, { status: 400 })

  const admin = createServiceRoleSupabaseClient()
  const updates: Record<string, unknown> = {}
  if (parsed.data.label !== undefined) {
    updates.label = parsed.data.label.trim()
    if (parsed.data.slug === undefined) {
      updates.slug = slugifyTagLabel(parsed.data.label)
    }
  }
  if (parsed.data.slug !== undefined) updates.slug = parsed.data.slug.trim()
  if (parsed.data.group_id !== undefined) updates.group_id = parsed.data.group_id

  const { data, error } = await admin
    .from('org_tags')
    .update(updates)
    .eq('id', id)
    .eq('org_id', orgId)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const { data: affected } = await admin
    .from('course_org_tags')
    .select('course_id')
    .eq('org_tag_id', id)

  for (const row of affected ?? []) {
    if (row.course_id) await syncCourseDenormalizedTags(admin, row.course_id)
  }

  return NextResponse.json(data)
}

export async function DELETE(
  _: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let orgId: string
  try {
    orgId = await requireOrgContentEditor(user.id)
  } catch {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const admin = createServiceRoleSupabaseClient()

  const { data: affected } = await admin
    .from('course_org_tags')
    .select('course_id')
    .eq('org_tag_id', id)

  const { error } = await admin.from('org_tags').delete().eq('id', id).eq('org_id', orgId)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const seen = new Set<string>()
  for (const row of affected ?? []) {
    if (row.course_id && !seen.has(row.course_id)) {
      seen.add(row.course_id)
      await syncCourseDenormalizedTags(admin, row.course_id)
    }
  }

  return new NextResponse(null, { status: 204 })
}

import { createClient, createServiceRoleSupabaseClient } from '@/lib/supabase/server'
import { getOrCreateOrg, requireOrgContentEditor } from '@/lib/org'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { slugifyTagLabel } from '@/lib/courseTags'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const admin = createServiceRoleSupabaseClient()
  const orgId = await getOrCreateOrg(user.id)
  const { data, error } = await admin
    .from('org_tags')
    .select('id, slug, label, group_id, created_at')
    .eq('org_id', orgId)
    .order('label', { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data ?? [])
}

const postSchema = z.object({
  label: z.string().min(1).max(120),
  group_id: z.string().uuid().nullable().optional(),
  slug: z.string().min(1).max(120).optional(),
})

export async function POST(request: NextRequest) {
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
  const parsed = postSchema.safeParse(json)
  if (!parsed.success) return NextResponse.json({ error: 'Invalid body' }, { status: 400 })

  const slug = parsed.data.slug?.trim() || slugifyTagLabel(parsed.data.label)
  const admin = createServiceRoleSupabaseClient()

  const { data, error } = await admin
    .from('org_tags')
    .insert({
      org_id: orgId,
      group_id: parsed.data.group_id ?? null,
      slug,
      label: parsed.data.label.trim(),
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}

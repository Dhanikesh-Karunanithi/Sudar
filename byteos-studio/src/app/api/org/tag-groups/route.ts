import { createClient, createAdminClient } from '@/lib/supabase/server'
import { getOrCreateOrg, requireOrgContentEditor } from '@/lib/org'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const admin = createAdminClient()
  const orgId = await getOrCreateOrg(user.id)
  const { data, error } = await admin
    .from('tag_groups')
    .select('id, name, sort_order, created_at')
    .eq('org_id', orgId)
    .order('sort_order', { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data ?? [])
}

const postSchema = z.object({
  name: z.string().min(1).max(120),
  sort_order: z.number().int().optional(),
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
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid body' }, { status: 400 })
  }

  const admin = createAdminClient()
  const { data: maxRow } = await admin
    .from('tag_groups')
    .select('sort_order')
    .eq('org_id', orgId)
    .order('sort_order', { ascending: false })
    .limit(1)
    .maybeSingle()

  const nextOrder =
    parsed.data.sort_order ?? (maxRow?.sort_order != null ? maxRow.sort_order + 1 : 0)

  const { data, error } = await admin
    .from('tag_groups')
    .insert({
      org_id: orgId,
      name: parsed.data.name.trim(),
      sort_order: nextOrder,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}

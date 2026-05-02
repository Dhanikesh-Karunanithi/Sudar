import { createClient, createServiceRoleSupabaseClient } from '@/lib/supabase/server'
import { getOrCreateOrg } from '@/lib/org'
import { NextResponse } from 'next/server'

/** Grouped master tags for course pickers and the tag library UI. */
export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const admin = createServiceRoleSupabaseClient()
  const orgId = await getOrCreateOrg(user.id)

  const { data: groups, error: gErr } = await admin
    .from('tag_groups')
    .select('id, name, sort_order')
    .eq('org_id', orgId)
    .order('sort_order', { ascending: true })

  if (gErr) return NextResponse.json({ error: gErr.message }, { status: 500 })

  const { data: tags, error: tErr } = await admin
    .from('org_tags')
    .select('id, slug, label, group_id')
    .eq('org_id', orgId)
    .order('label', { ascending: true })

  if (tErr) return NextResponse.json({ error: tErr.message }, { status: 500 })

  const groupList = groups ?? []
  const tagList = tags ?? []

  const ungrouped = tagList.filter((t) => !t.group_id)
  const byGroup = new Map<string | null, typeof tagList>()
  for (const g of groupList) {
    byGroup.set(g.id, tagList.filter((t) => t.group_id === g.id))
  }
  byGroup.set(null, ungrouped)

  const groupsOut = groupList.map((g) => ({
    id: g.id,
    name: g.name,
    sort_order: g.sort_order,
    tags: (byGroup.get(g.id) ?? []).map((t) => ({
      id: t.id,
      slug: t.slug,
      label: t.label,
    })),
  }))

  if (ungrouped.length > 0) {
    groupsOut.push({
      id: 'ungrouped',
      name: 'Ungrouped',
      sort_order: 10000,
      tags: ungrouped.map((t) => ({ id: t.id, slug: t.slug, label: t.label })),
    })
  }

  return NextResponse.json({ groups: groupsOut })
}

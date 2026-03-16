import { createClient, createAdminClient } from '@/lib/supabase/server'
import { requireSuperAdmin } from '@/lib/org'
import { NextResponse } from 'next/server'

export async function GET() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    await requireSuperAdmin(user.id)
  } catch {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const admin = createAdminClient()

  const [{ data: orgs }, { data: memberCounts }] = await Promise.all([
    admin
      .from('organisations')
      .select('id, name, slug, plan, created_at'),
    admin
      .from('org_members')
      .select('org_id, user_id'),
  ])

  const counts = new Map<string, number>()
  for (const m of memberCounts ?? []) {
    counts.set(m.org_id, (counts.get(m.org_id) ?? 0) + 1)
  }

  const result = (orgs ?? []).map((o) => ({
    id: o.id,
    name: o.name,
    slug: o.slug,
    plan: o.plan,
    created_at: o.created_at,
    member_count: counts.get(o.id) ?? 0,
  }))

  return NextResponse.json(result)
}


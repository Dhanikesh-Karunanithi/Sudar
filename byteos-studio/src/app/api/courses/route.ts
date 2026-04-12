import { createClient, createAdminClient } from '@/lib/supabase/server'
import { getOrCreateOrg } from '@/lib/org'
import { NextRequest, NextResponse } from 'next/server'
import { fetchOrgTagCatalog, resolveOrCreateOrgTagsForLabels, setCourseOrgTagIds } from '@/lib/courseTags'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const admin = createAdminClient()
  const orgId = await getOrCreateOrg(user.id)

  const { data, error } = await admin
    .from('courses')
    .select('id, title, description, status, difficulty, estimated_duration_mins, created_at, updated_at')
    .eq('org_id', orgId)
    .order('updated_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const admin = createAdminClient()
  const orgId = await getOrCreateOrg(user.id)
  const body = await request.json() as {
    title?: string
    description?: string | null
    difficulty?: string
    tag_labels?: string[]
    thumbnail_url?: string | null
    banner_url?: string | null
  }

  if (!body.title?.trim()) return NextResponse.json({ error: 'title required' }, { status: 400 })

  const now = new Date().toISOString()
  const { data, error } = await admin
    .from('courses')
    .insert({
      org_id: orgId,
      created_by: user.id,
      title: body.title.trim(),
      description: body.description ?? null,
      difficulty: body.difficulty ?? 'intermediate',
      status: 'draft',
      tags: [],
      thumbnail_url: body.thumbnail_url ?? null,
      banner_url: body.banner_url ?? null,
      created_at: now,
      updated_at: now,
    })
    .select('id')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  if (data?.id && Array.isArray(body.tag_labels) && body.tag_labels.length > 0) {
    try {
      const catalog = await fetchOrgTagCatalog(admin, orgId)
      const ids = await resolveOrCreateOrgTagsForLabels(admin, orgId, body.tag_labels, catalog)
      await setCourseOrgTagIds(admin, data.id, ids)
    } catch {
      /* non-fatal */
    }
  }

  return NextResponse.json(data, { status: 201 })
}

import { createClient, createAdminClient } from '@/lib/supabase/server'
import { getOrCreateOrg } from '@/lib/org'
import { NextRequest, NextResponse } from 'next/server'
import { fetchOrgTagCatalog, resolveOrCreateOrgTagsForLabels, setCourseOrgTagIds } from '@/lib/courseTags'
import type { Database } from '@/types/database'

type CourseInsert = Database['public']['Tables']['courses']['Insert']

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
  // Only include optional image columns when set. If `banner_url` is absent from the DB (migration not
  // applied), PostgREST still accepts the row; sending `banner_url: null` references the column and fails.
  const insertRow: CourseInsert = {
    org_id: orgId,
    created_by: user.id,
    title: body.title.trim(),
    description: body.description ?? null,
    difficulty: body.difficulty ?? 'intermediate',
    status: 'draft',
    tags: [],
    created_at: now,
    updated_at: now,
  }
  const thumb = body.thumbnail_url?.trim()
  const banner = body.banner_url?.trim()
  if (thumb) insertRow.thumbnail_url = thumb
  if (banner) insertRow.banner_url = banner

  const { data, error } = await admin.from('courses').insert(insertRow)
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

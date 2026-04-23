import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient, createClient } from '@/lib/supabase/server'
import { requireOrgAdmin } from '@/lib/org'

export async function GET() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const orgId = await requireOrgAdmin(user.id).catch(() => null)
  if (!orgId) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const admin = createAdminClient()
  const { data, error } = await admin
    .from('notification_templates')
    .select('*')
    .or(`org_id.eq.${orgId},org_id.is.null`)
    .order('created_at', { ascending: false })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data: data ?? [] })
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const orgId = await requireOrgAdmin(user.id).catch(() => null)
  if (!orgId) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>
  if (!body.slug || !body.category_slug || !body.title_mustache) {
    return NextResponse.json({ error: 'slug, category_slug, and title_mustache are required' }, { status: 400 })
  }

  const admin = createAdminClient()
  const { data, error } = await admin
    .from('notification_templates')
    .insert({
      org_id: orgId,
      slug: body.slug,
      category_slug: body.category_slug,
      title_mustache: body.title_mustache,
      body_mustache: body.body_mustache ?? null,
      cta_label: body.cta_label ?? null,
      cta_url_mustache: body.cta_url_mustache ?? null,
      branding: body.branding ?? {},
      channels: body.channels ?? ['in_app'],
      locale: body.locale ?? 'en',
      is_active: body.is_active ?? true,
      created_by: user.id,
    })
    .select('*')
    .single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data }, { status: 201 })
}

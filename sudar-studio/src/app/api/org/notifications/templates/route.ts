import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient, createClient } from '@/lib/supabase/server'
import { requireOrgAdmin } from '@/lib/org'
import type { Database, Json } from '@/types/database'

type NotificationTemplateInsert = Database['public']['Tables']['notification_templates']['Insert']

function optionalString(value: unknown): string | null {
  return typeof value === 'string' && value.trim() ? value : null
}

function stringArray(value: unknown, fallback: string[]): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : fallback
}

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
  const templateInsert: NotificationTemplateInsert = {
    org_id: orgId,
    slug: String(body.slug),
    category_slug: String(body.category_slug),
    title_mustache: String(body.title_mustache),
    body_mustache: optionalString(body.body_mustache),
    cta_label: optionalString(body.cta_label),
    cta_url_mustache: optionalString(body.cta_url_mustache),
    branding: (body.branding ?? {}) as Json,
    channels: stringArray(body.channels, ['in_app']),
    locale: optionalString(body.locale) ?? 'en',
    is_active: typeof body.is_active === 'boolean' ? body.is_active : true,
    created_by: user.id,
  }

  const { data, error } = await admin
    .from('notification_templates')
    .insert(templateInsert)
    .select('*')
    .single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data }, { status: 201 })
}

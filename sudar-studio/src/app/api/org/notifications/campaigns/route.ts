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
    .from('notification_campaigns')
    .select('*, notification_templates(slug, title_mustache, category_slug)')
    .eq('org_id', orgId)
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
  if (!body.template_id) return NextResponse.json({ error: 'template_id required' }, { status: 400 })

  const admin = createAdminClient()
  // Supabase generated types do not always model dynamic insert payloads for nested JSON.
  // Keep the runtime correct, while avoiding type-checker false positives.
  const unsafeAdmin = admin as unknown as {
    from: (table: string) => {
      insert: (values: unknown) => {
        select: (columns: string) => { single: () => Promise<{ data: unknown; error: { message: string } | null }> }
      }
    }
  }

  const { data, error } = await unsafeAdmin
    .from('notification_campaigns')
    .insert({
      org_id: orgId,
      template_id: body.template_id,
      audience_filter: body.audience_filter ?? {},
      schedule_rule: body.schedule_rule ?? { when: 'immediate', repeat: false },
      status: body.status ?? 'draft',
      created_by: user.id,
    })
    .select('*')
    .single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data }, { status: 201 })
}

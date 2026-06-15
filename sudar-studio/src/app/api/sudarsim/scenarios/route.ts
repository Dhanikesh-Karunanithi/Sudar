import { createClient, createServiceRoleSupabaseClient } from '@/lib/supabase/server'
import { getOrCreateOrg } from '@/lib/org'
import { buildScenarioRow } from '@/lib/sudarsim/buildScenarioRow'
import { NextRequest, NextResponse } from 'next/server'
import { simScenarioSchema } from '@shared-sudarsim/schemas'

export async function GET() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const admin = createServiceRoleSupabaseClient()
  const orgId = await getOrCreateOrg(user.id)

  const { data, error } = await admin
    .from('sim_scenarios')
    .select('id, title, locale, status, created_at, updated_at')
    .eq('org_id', orgId)
    .order('updated_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true, scenarios: data ?? [] })
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const admin = createServiceRoleSupabaseClient()
  const orgId = await getOrCreateOrg(user.id)
  const body = await request.json().catch(() => ({}))
  const parsed = simScenarioSchema.partial().safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const row = buildScenarioRow(parsed.data, orgId, user.id, false)
  const { data, error } = await admin.from('sim_scenarios').insert(row).select('id').single()

  if (error || !data) {
    return NextResponse.json({ error: error?.message ?? 'Create failed' }, { status: 500 })
  }

  return NextResponse.json({ success: true, id: data.id }, { status: 201 })
}

import { createClient, createServiceRoleSupabaseClient } from '@/lib/supabase/server'
import { getOrCreateOrg } from '@/lib/org'
import { buildScenarioRow } from '@/lib/sudarsim/buildScenarioRow'
import { NextRequest, NextResponse } from 'next/server'
import { simCrmSkinSchema, simScenarioSchema } from '@shared-sudarsim/schemas'

type RouteParams = { params: Promise<{ id: string }> }

async function getOrgScenario(admin: ReturnType<typeof createServiceRoleSupabaseClient>, orgId: string, scenarioId: string) {
  const { data } = await admin.from('sim_scenarios').select('*').eq('id', scenarioId).eq('org_id', orgId).maybeSingle()
  return data
}

export async function GET(_request: NextRequest, { params }: RouteParams) {
  const { id: scenarioId } = await params
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const admin = createServiceRoleSupabaseClient()
  const orgId = await getOrCreateOrg(user.id)
  const scenario = await getOrgScenario(admin, orgId, scenarioId)
  if (!scenario) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const { data: skin } = await admin.from('sim_crm_skins').select('*').eq('scenario_id', scenarioId).maybeSingle()

  return NextResponse.json({
    success: true,
    scenario,
    crm_skin: skin
      ? {
          image_url: skin.image_url,
          width: skin.width,
          height: skin.height,
          overlays: skin.overlays,
        }
      : null,
  })
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  const { id: scenarioId } = await params
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const admin = createServiceRoleSupabaseClient()
  const orgId = await getOrCreateOrg(user.id)
  const existing = await getOrgScenario(admin, orgId, scenarioId)
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const body = await request.json()
  const publish = body.publish === true
  const scenarioParsed = simScenarioSchema.partial().safeParse(body.scenario ?? body)
  if (!scenarioParsed.success) {
    return NextResponse.json({ error: scenarioParsed.error.flatten() }, { status: 400 })
  }

  if (publish) {
    const draft = scenarioParsed.data
    const channels = draft.channels ?? { phone: true, chat: true, email: true }
    const hasChannel = Boolean(channels.phone || channels.chat || channels.email)
    const personaName = draft.persona?.name?.trim()
    const title = draft.title?.trim() || (existing.title as string | undefined)?.trim()

    if (!title) {
      return NextResponse.json({ error: 'Title is required before publishing' }, { status: 400 })
    }
    if (!personaName) {
      return NextResponse.json({ error: 'Customer persona name is required before publishing' }, { status: 400 })
    }
    if (!hasChannel) {
      return NextResponse.json({ error: 'Enable at least one channel before publishing' }, { status: 400 })
    }
  }

  const scenarioRow = buildScenarioRow(scenarioParsed.data, orgId, user.id, publish)
  const { error } = await admin.from('sim_scenarios').update(scenarioRow).eq('id', scenarioId)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  if (body.crm_skin) {
    const skinParsed = simCrmSkinSchema.safeParse(body.crm_skin)
    if (skinParsed.success) {
      await admin.from('sim_crm_skins').upsert(
        {
          org_id: orgId,
          scenario_id: scenarioId,
          image_url: skinParsed.data.image_url,
          width: skinParsed.data.width,
          height: skinParsed.data.height,
          overlays: skinParsed.data.overlays,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'scenario_id' },
      )
    }
  }

  return NextResponse.json({ success: true, scenario_id: scenarioId })
}

export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  const { id: scenarioId } = await params
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const admin = createServiceRoleSupabaseClient()
  const orgId = await getOrCreateOrg(user.id)
  const existing = await getOrgScenario(admin, orgId, scenarioId)
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const { error } = await admin.from('sim_scenarios').delete().eq('id', scenarioId).eq('org_id', orgId)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ success: true })
}

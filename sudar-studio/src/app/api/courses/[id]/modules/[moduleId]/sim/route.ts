import { createClient, createServiceRoleSupabaseClient } from '@/lib/supabase/server'
import { getOrCreateOrg } from '@/lib/org'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

type RouteParams = { params: Promise<{ id: string; moduleId: string }> }

const linkBodySchema = z.object({
  sim_scenario_id: z.string().uuid().nullable(),
})

export async function GET(_request: NextRequest, { params }: RouteParams) {
  const { id: courseId, moduleId } = await params
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const admin = createServiceRoleSupabaseClient()
  const { data: mod } = await admin
    .from('modules')
    .select('sim_scenario_id')
    .eq('id', moduleId)
    .eq('course_id', courseId)
    .single()

  if (!mod?.sim_scenario_id) {
    return NextResponse.json({ success: true, scenario: null, crm_skin: null })
  }

  const { data: scenario } = await admin.from('sim_scenarios').select('*').eq('id', mod.sim_scenario_id).single()
  const { data: skin } = await admin.from('sim_crm_skins').select('*').eq('scenario_id', mod.sim_scenario_id).maybeSingle()

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

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const { id: courseId, moduleId } = await params
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const parsed = linkBodySchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const admin = createServiceRoleSupabaseClient()
  const orgId = await getOrCreateOrg(user.id)

  const { data: mod } = await admin
    .from('modules')
    .select('id')
    .eq('id', moduleId)
    .eq('course_id', courseId)
    .single()
  if (!mod) return NextResponse.json({ error: 'Module not found' }, { status: 404 })

  if (parsed.data.sim_scenario_id) {
    const { data: scenario } = await admin
      .from('sim_scenarios')
      .select('id')
      .eq('id', parsed.data.sim_scenario_id)
      .eq('org_id', orgId)
      .maybeSingle()
    if (!scenario) return NextResponse.json({ error: 'Scenario not found in org' }, { status: 404 })
  }

  const { error } = await admin
    .from('modules')
    .update({ sim_scenario_id: parsed.data.sim_scenario_id })
    .eq('id', moduleId)
    .eq('course_id', courseId)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true, sim_scenario_id: parsed.data.sim_scenario_id })
}

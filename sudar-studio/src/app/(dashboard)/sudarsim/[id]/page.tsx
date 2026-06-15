import { createClient, createServiceRoleSupabaseClient } from '@/lib/supabase/server'
import { getOrCreateOrg } from '@/lib/org'
import { notFound, redirect } from 'next/navigation'
import { SimScenarioEditor } from '@/components/sudarsim/SimScenarioEditor'

export default async function SudarsimEditPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id: scenarioId } = await params
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const admin = createServiceRoleSupabaseClient()
  const orgId = await getOrCreateOrg(user.id)

  const { data: scenario } = await admin
    .from('sim_scenarios')
    .select('*')
    .eq('id', scenarioId)
    .eq('org_id', orgId)
    .maybeSingle()

  if (!scenario) notFound()

  const { data: skin } = await admin
    .from('sim_crm_skins')
    .select('*')
    .eq('scenario_id', scenarioId)
    .maybeSingle()

  type SkinRow = { image_url: string; width: number; height: number; overlays: unknown }
  const skinRow = skin as SkinRow | null

  const initialCrmSkin = skinRow
    ? {
        image_url: skinRow.image_url,
        width: skinRow.width,
        height: skinRow.height,
        overlays: skinRow.overlays,
      }
    : null

  return (
    <SimScenarioEditor
      scenarioId={scenarioId}
      initialScenario={scenario}
      initialCrmSkin={initialCrmSkin}
    />
  )
}

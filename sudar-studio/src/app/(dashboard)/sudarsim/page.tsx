import { createClient, createServiceRoleSupabaseClient } from '@/lib/supabase/server'
import { getOrCreateOrg } from '@/lib/org'
import { Phone } from 'lucide-react'
import { SudarsimCreateButton, SudarsimLibraryClient } from './SudarsimLibraryClient'

export default async function SudarsimLibraryPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  const admin = createServiceRoleSupabaseClient()
  const orgId = await getOrCreateOrg(user!.id)

  const { data: scenarios } = await admin
    .from('sim_scenarios')
    .select('id, title, locale, status, created_at, updated_at')
    .eq('org_id', orgId)
    .order('updated_at', { ascending: false })

  const list = scenarios ?? []

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-8">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <Phone className="w-6 h-6 text-violet-400" aria-hidden />
            SudarSim
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Build roleplay scenarios for your org. Link them to course modules when learners should practice in context.
          </p>
        </div>
        <SudarsimCreateButton />
      </div>

      {list.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 border-dashed rounded-2xl py-16 text-center space-y-4">
          <div className="w-14 h-14 rounded-xl bg-violet-600/15 border border-violet-500/20 flex items-center justify-center mx-auto">
            <Phone className="w-7 h-7 text-violet-400" aria-hidden />
          </div>
          <div>
            <p className="text-slate-300 font-medium">No scenarios yet</p>
            <p className="text-slate-500 text-sm mt-1">
              Create customer roleplay with phone, chat, email, and CRM overlay practice.
            </p>
          </div>
          <SudarsimCreateButton />
        </div>
      ) : (
        <SudarsimLibraryClient scenarios={list} />
      )}
    </div>
  )
}

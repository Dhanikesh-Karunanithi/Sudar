import type { SupabaseClient } from '@supabase/supabase-js'
import { orgSettingsToAiChatContext, type OrgAiChatContext } from '@/lib/ai/orgAiChatContext'
import type { Database } from '@/types/database'

type AdminClient = SupabaseClient<Database>

export async function fetchStudioOrgAiContext(admin: AdminClient, orgId: string): Promise<OrgAiChatContext> {
  const { data: org } = await admin.from('organisations').select('settings').eq('id', orgId).single()
  return orgSettingsToAiChatContext(org?.settings)
}

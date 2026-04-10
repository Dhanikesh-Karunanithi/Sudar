import type { createAdminClient } from '@/lib/supabase/server'
import { orgSettingsToAiChatContext, type OrgAiChatContext } from '@/lib/ai/orgAiChatContext'

type AdminClient = ReturnType<typeof createAdminClient>

export async function fetchStudioOrgAiContext(admin: AdminClient, orgId: string): Promise<OrgAiChatContext> {
  const { data: org } = await admin.from('organisations').select('settings').eq('id', orgId).single()
  return orgSettingsToAiChatContext(org?.settings)
}

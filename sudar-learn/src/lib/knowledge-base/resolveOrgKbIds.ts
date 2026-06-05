import type { createServiceRoleSupabaseClient } from '@/lib/supabase/server'

type Admin = ReturnType<typeof createServiceRoleSupabaseClient>

/**
 * Resolve knowledge base IDs available for RAG in tutor context.
 * Includes org-wide and subject KBs; optionally course-scoped KBs when courseId is set.
 */
export async function resolveOrgKbIdsForRag(
  admin: Admin,
  orgId: string,
  courseId?: string | null,
): Promise<string[]> {
  const query = admin
    .from('knowledge_bases')
    .select('id, scope, course_id')
    .eq('org_id', orgId)

  const { data, error } = await query
  if (error || !data?.length) return []

  const ids: string[] = []
  for (const row of data) {
    const scope = row.scope as string
    if (scope === 'org' || scope === 'subject') {
      ids.push(row.id as string)
      continue
    }
    if (scope === 'course' && courseId && row.course_id === courseId) {
      ids.push(row.id as string)
    }
  }
  return [...new Set(ids)]
}

export function learnerKbUploadAllowed(orgSettings: unknown): boolean {
  const settings = (orgSettings as Record<string, unknown> | null) ?? {}
  const kb = settings.knowledge_bases as Record<string, unknown> | undefined
  return kb?.allow_learner_uploads === true
}

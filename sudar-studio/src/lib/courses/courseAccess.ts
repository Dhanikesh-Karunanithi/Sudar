import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'

export interface EditableCourse {
  id: string
  org_id: string | null
  created_by: string | null
  title: string
}

/**
 * A course is editable by its creator, or by an ADMIN/MANAGER of the course's organisation.
 * Service-role reads bypass RLS, so every Studio route that mutates a course must call this.
 */
export async function getEditableCourse(
  admin: SupabaseClient<Database>,
  courseId: string,
  userId: string,
): Promise<EditableCourse | null> {
  const { data: course } = await admin
    .from('courses')
    .select('id, org_id, created_by, title')
    .eq('id', courseId)
    .maybeSingle()
  if (!course) return null
  const row = course as EditableCourse
  if (row.created_by === userId) return row
  if (!row.org_id) return null
  const { data: membership } = await admin
    .from('org_members')
    .select('role')
    .eq('org_id', row.org_id)
    .eq('user_id', userId)
    .in('role', ['ADMIN', 'MANAGER'])
    .limit(1)
    .maybeSingle()
  return membership ? row : null
}

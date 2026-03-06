import { getOrCreateOrg } from '@/lib/org'
import { createAdminClient, createClient } from '@/lib/supabase/server'
import type { CourseAccessAction, CourseAccessResult, OrgRole } from '@/types/courseAccess'

const AUTHORING_ROLES: OrgRole[] = ['ADMIN', 'MANAGER', 'CREATOR']
const COURSE_ACTION_ROLES: Record<CourseAccessAction, OrgRole[]> = {
  view: AUTHORING_ROLES,
  edit: AUTHORING_ROLES,
  preview: AUTHORING_ROLES,
  add_module: AUTHORING_ROLES,
  update_module: AUTHORING_ROLES,
  delete_module: AUTHORING_ROLES,
  publish: ['ADMIN', 'MANAGER'],
  delete_course: ['ADMIN', 'MANAGER'],
}

function normalizeOrgRole(role: string | null | undefined): OrgRole | null {
  const normalized = role?.toUpperCase()
  if (normalized === 'ADMIN' || normalized === 'MANAGER' || normalized === 'CREATOR' || normalized === 'LEARNER') {
    return normalized
  }
  return null
}

function permissionError(action: CourseAccessAction): string {
  if (action === 'publish') return 'Only admins and managers can publish or unpublish courses.'
  if (action === 'delete_course') return 'Only admins and managers can delete courses.'
  return 'You do not have permission to access this course.'
}

export async function authorizeCourseAccess(courseId: string, action: CourseAccessAction): Promise<CourseAccessResult> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { ok: false, status: 401, error: 'Unauthorized' }
  }

  const admin = createAdminClient()
  const orgId = await getOrCreateOrg(user.id)

  const { data: course, error: courseError } = await admin
    .from('courses')
    .select('id, org_id, created_by, title, description, status')
    .eq('id', courseId)
    .single()

  if (courseError || !course) {
    return { ok: false, status: 404, error: 'Course not found' }
  }

  if (course.org_id !== orgId) {
    return { ok: false, status: 403, error: 'You do not have access to this course.' }
  }

  const { data: membership } = await admin
    .from('org_members')
    .select('role')
    .eq('org_id', orgId)
    .eq('user_id', user.id)
    .maybeSingle()

  const orgRole = normalizeOrgRole((membership as { role?: string | null } | null)?.role)
  if (!orgRole) {
    return { ok: false, status: 403, error: 'You do not belong to this workspace.' }
  }

  if (!COURSE_ACTION_ROLES[action].includes(orgRole)) {
    return { ok: false, status: 403, error: permissionError(action) }
  }

  return {
    ok: true,
    userId: user.id,
    orgId,
    orgRole,
    course,
  }
}

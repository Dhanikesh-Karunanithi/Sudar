import type { Database } from '@/types/database'

export type OrgRole = Database['public']['Enums']['org_role']

export type CourseAccessAction =
  | 'view'
  | 'edit'
  | 'preview'
  | 'add_module'
  | 'update_module'
  | 'delete_module'
  | 'publish'
  | 'delete_course'

export type AuthorizedCourse = Pick<
  Database['public']['Tables']['courses']['Row'],
  'id' | 'org_id' | 'created_by' | 'title' | 'description' | 'status'
>

export interface CourseAccessSuccess {
  ok: true
  userId: string
  orgId: string
  orgRole: OrgRole
  course: AuthorizedCourse
}

export interface CourseAccessFailure {
  ok: false
  status: 401 | 403 | 404
  error: string
}

export type CourseAccessResult = CourseAccessSuccess | CourseAccessFailure

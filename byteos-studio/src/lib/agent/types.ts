/**
 * Sudar Agent — context envelope and Studio action types.
 * Used by the Studio agent API and (optionally) a future unified backend.
 */

export type AgentSurface = 'learn' | 'studio'

export interface ContextEnvelope {
  surface: AgentSurface
  user_id: string
  org_id?: string
  route?: string
  course_id?: string
  module_id?: string
}

/** Studio action types (for ACTIONS: [...] in model response). */
export const STUDIO_ACTION_TYPES = [
  'open_user',
  'open_course',
  'open_path',
  'assign_course',
  'assign_path',
  'get_analytics_summary',
  'export_users_csv',
  'export_course_time',
] as const

export type StudioActionType = (typeof STUDIO_ACTION_TYPES)[number]

export interface StudioActionOpenUser {
  type: 'open_user'
  user_id: string
  label?: string
}

export interface StudioActionOpenCourse {
  type: 'open_course'
  course_id: string
  label?: string
}

export interface StudioActionOpenPath {
  type: 'open_path'
  path_id: string
  label?: string
}

export interface StudioActionAssignCourse {
  type: 'assign_course'
  user_id: string
  course_id: string
  label?: string
}

export interface StudioActionAssignPath {
  type: 'assign_path'
  user_id: string
  path_id: string
  label?: string
}

export interface StudioActionExportCourseTime {
  type: 'export_course_time'
  course_id: string
  label?: string
}

export type StudioAction =
  | StudioActionOpenUser
  | StudioActionOpenCourse
  | StudioActionOpenPath
  | StudioActionAssignCourse
  | StudioActionAssignPath
  | { type: 'get_analytics_summary'; label?: string }
  | { type: 'export_users_csv'; label?: string }
  | StudioActionExportCourseTime

export interface StudioContextResult {
  /** Full prompt-ready context string to inject into the system prompt. */
  contextPrompt: string
  /** Org summary for optional use in action execution. */
  orgSummary: {
    orgName: string
    totalLearners: number
    totalCourses: number
    totalPaths: number
    completionRate: number
    totalLearningMins: number
    aiInteractions: number
  }
  /** Valid user IDs in this org (for action validation). */
  userIds: Set<string>
  /** Valid course IDs in this org (published, for assignment). */
  courseIds: Set<string>
  /** Valid path IDs in this org (published). */
  pathIds: Set<string>
  /** Precomputed analytics summary text (for get_analytics_summary or initial context). */
  analyticsSummaryText: string
}

/**
 * Builds allowlists for tutor model ACTIONS so learners only get navigation buttons
 * to published catalog courses, published paths, or courses they are enrolled in.
 */

export type TutorEnrollmentForActions = {
  course_id: string | null
  status: string
  progress_pct: number | null
}

export function buildTutorActionAllowlists(args: {
  catalogCourseIds: readonly string[]
  pathIds: readonly string[]
  enrollments: readonly TutorEnrollmentForActions[]
  /** When set (learner is in a course thread), that course id is always allowed — model often suggests Continue / Review for the active course. */
  activeCourseId: string | null
}): {
  allowedCourseIds: Set<string>
  allowedPathIds: Set<string>
  enrollmentByCourseId: Map<string, { status: string; progress_pct: number }>
} {
  const allowedCourseIds = new Set<string>()
  const allowedPathIds = new Set<string>()
  const enrollmentByCourseId = new Map<string, { status: string; progress_pct: number }>()

  for (const id of args.catalogCourseIds) {
    if (id) allowedCourseIds.add(id)
  }
  for (const id of args.pathIds) {
    if (id) allowedPathIds.add(id)
  }
  for (const e of args.enrollments) {
    if (!e.course_id) continue
    enrollmentByCourseId.set(e.course_id, { status: e.status, progress_pct: e.progress_pct ?? 0 })
    allowedCourseIds.add(e.course_id)
  }
  if (args.activeCourseId) {
    allowedCourseIds.add(args.activeCourseId)
  }

  return { allowedCourseIds, allowedPathIds, enrollmentByCourseId }
}

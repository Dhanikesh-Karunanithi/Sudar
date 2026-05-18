/**
 * Enrollment progress must reflect unique modules completed, not raw
 * `module_complete` event rows (retries, SCORM, or duplicate posts can inflate counts).
 */
export function distinctModuleCompleteCount(params: {
  courseModuleIds: string[]
  completedModuleIds: (string | null | undefined)[]
}): number {
  const valid = new Set(params.courseModuleIds)
  const seen = new Set<string>()
  for (const id of params.completedModuleIds) {
    if (typeof id === 'string' && valid.has(id)) seen.add(id)
  }
  return seen.size
}

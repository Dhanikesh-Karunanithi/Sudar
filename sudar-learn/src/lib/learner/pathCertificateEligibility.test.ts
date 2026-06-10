import { describe, expect, it } from 'vitest'
import { computeCourseProgressSnapshot } from './courseEnrollmentProgress'

describe('path certificate eligibility helpers', () => {
  it('does not mark a course complete until all modules are distinct-completed', () => {
    const partial = computeCourseProgressSnapshot(4, 1)
    expect(partial.status).not.toBe('completed')

    const complete = computeCourseProgressSnapshot(4, 4)
    expect(complete.status).toBe('completed')
  })
})

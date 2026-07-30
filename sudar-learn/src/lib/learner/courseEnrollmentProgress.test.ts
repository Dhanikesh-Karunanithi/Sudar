import { describe, expect, it } from 'vitest'

import {
  computeCourseProgressPct,
  countDistinctModuleCompletes,
} from './courseEnrollmentProgress'

describe('countDistinctModuleCompletes', () => {
  it('counts each module_id once even when duplicate events exist', () => {
    const count = countDistinctModuleCompletes([
      { module_id: 'a' },
      { module_id: 'a' },
      { module_id: 'b' },
      { module_id: null },
    ])
    expect(count).toBe(2)
  })
})

describe('computeCourseProgressPct', () => {
  it('caps progress at 100% when all modules are done', () => {
    expect(computeCourseProgressPct(5, 5)).toEqual({ progress: 100, status: 'completed' })
  })

  it('does not mark complete when duplicate events inflated the count beyond modules', () => {
    expect(computeCourseProgressPct(3, 2)).toEqual({ progress: 100, status: 'completed' })
  })

  it('returns in_progress for partial completion', () => {
    expect(computeCourseProgressPct(1, 4)).toEqual({ progress: 25, status: 'in_progress' })
  })
})

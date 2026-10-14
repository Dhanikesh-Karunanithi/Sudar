import { describe, expect, it } from 'vitest'

import {
  computeCourseProgressPct,
  countDistinctModuleCompletes,
} from '@/lib/learner/courseEnrollmentProgress'

describe('countDistinctModuleCompletes', () => {
  it('counts each module_id once even when SCORM re-fires completion', () => {
    const moduleA = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'
    const rows = [
      { module_id: moduleA },
      { module_id: moduleA },
      { module_id: moduleA },
    ]
    expect(countDistinctModuleCompletes(rows)).toBe(1)
  })

  it('counts distinct modules separately', () => {
    const rows = [
      { module_id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa' },
      { module_id: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb' },
      { module_id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa' },
    ]
    expect(countDistinctModuleCompletes(rows)).toBe(2)
  })

  it('ignores null module_id rows (engagement telemetry without a module)', () => {
    const rows = [
      { module_id: null },
      { module_id: null },
      { module_id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa' },
    ]
    expect(countDistinctModuleCompletes(rows)).toBe(1)
  })
})

describe('computeCourseProgressPct', () => {
  it('does not mark complete until all modules are distinct-completed', () => {
    expect(computeCourseProgressPct(1, 5)).toEqual({ progress: 20, status: 'in_progress' })
    expect(computeCourseProgressPct(5, 5)).toEqual({ progress: 100, status: 'completed' })
  })

  it('caps progress at 100', () => {
    expect(computeCourseProgressPct(6, 5)).toEqual({ progress: 100, status: 'completed' })
  })
})

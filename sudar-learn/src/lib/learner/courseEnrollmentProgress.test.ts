import { describe, expect, it } from 'vitest'
import { computeEnrollmentProgressPercent } from '@/lib/learner/courseEnrollmentProgress'

describe('computeEnrollmentProgressPercent', () => {
  it('uses distinct module count, not duplicate completion events', () => {
    const fiveModuleCourse = 5
    // One module completed five times must not mark the course complete.
    expect(computeEnrollmentProgressPercent(1, fiveModuleCourse)).toEqual({
      progressPct: 20,
      status: 'in_progress',
    })
    expect(computeEnrollmentProgressPercent(5, fiveModuleCourse)).toEqual({
      progressPct: 100,
      status: 'completed',
    })
  })

  it('returns zero progress when the course has no modules', () => {
    expect(computeEnrollmentProgressPercent(3, 0)).toEqual({
      progressPct: 0,
      status: 'in_progress',
    })
  })
})

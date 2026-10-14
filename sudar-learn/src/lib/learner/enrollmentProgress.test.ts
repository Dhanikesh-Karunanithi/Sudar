import { describe, expect, it } from 'vitest'
import {
  computeEnrollmentProgress,
  countDistinctCompletedModules,
} from '@/lib/learner/enrollmentProgress'

describe('countDistinctCompletedModules', () => {
  it('counts unique module_id values only', () => {
    const rows = [
      { module_id: 'mod-a' },
      { module_id: 'mod-a' },
      { module_id: 'mod-b' },
      { module_id: null },
    ]
    expect(countDistinctCompletedModules(rows)).toBe(2)
  })
})

describe('computeEnrollmentProgress', () => {
  it('does not mark complete when duplicate events inflate raw count', () => {
    const { progress_pct, status } = computeEnrollmentProgress(2, 3)
    expect(progress_pct).toBe(67)
    expect(status).toBe('in_progress')
  })

  it('marks complete only when all modules are done', () => {
    const { progress_pct, status } = computeEnrollmentProgress(3, 3)
    expect(progress_pct).toBe(100)
    expect(status).toBe('completed')
  })
})

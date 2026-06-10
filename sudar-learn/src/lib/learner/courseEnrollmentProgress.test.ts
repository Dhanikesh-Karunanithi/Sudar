import { describe, expect, it } from 'vitest'
import { computeCourseProgressSnapshot } from './courseEnrollmentProgress'

describe('computeCourseProgressSnapshot', () => {
  it('uses distinct module completion ratio, not event count inflation', () => {
    const snapshot = computeCourseProgressSnapshot(10, 1)
    expect(snapshot.progressPct).toBe(10)
    expect(snapshot.status).toBe('in_progress')
  })

  it('marks course completed only at 100%', () => {
    const snapshot = computeCourseProgressSnapshot(5, 5)
    expect(snapshot.progressPct).toBe(100)
    expect(snapshot.status).toBe('completed')
  })

  it('caps progress at 100% when completed modules exceed total', () => {
    const snapshot = computeCourseProgressSnapshot(3, 5)
    expect(snapshot.progressPct).toBe(100)
    expect(snapshot.status).toBe('completed')
  })

  it('returns not_started when no modules are complete', () => {
    const snapshot = computeCourseProgressSnapshot(8, 0)
    expect(snapshot.progressPct).toBe(0)
    expect(snapshot.status).toBe('not_started')
  })
})

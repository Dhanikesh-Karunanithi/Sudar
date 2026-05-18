import { describe, expect, it } from 'vitest'
import { distinctModuleCompleteCount } from './moduleCompletionProgress'

describe('distinctModuleCompleteCount', () => {
  it('counts each course module at most once', () => {
    const m1 = '11111111-1111-1111-1111-111111111111'
    const m2 = '22222222-2222-2222-2222-222222222222'
    expect(
      distinctModuleCompleteCount({
        courseModuleIds: [m1, m2],
        completedModuleIds: [m1, m1, m1, m2],
      }),
    ).toBe(2)
  })

  it('ignores null ids and ids not in the course', () => {
    const m1 = '11111111-1111-1111-1111-111111111111'
    const other = '99999999-9999-9999-9999-999999999999'
    expect(
      distinctModuleCompleteCount({
        courseModuleIds: [m1],
        completedModuleIds: [null, undefined, other, m1],
      }),
    ).toBe(1)
  })
})

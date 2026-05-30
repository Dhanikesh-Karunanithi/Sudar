import { describe, expect, it, vi } from 'vitest'
import { countDistinctCompletedModules, pathMandatoryCoursesCompleted } from './courseProgress'

function mockAdmin(rows: Array<{ module_id: string | null }>) {
  const chain = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    not: vi.fn().mockResolvedValue({ data: rows }),
  }
  return { from: vi.fn().mockReturnValue(chain) } as unknown as Parameters<
    typeof countDistinctCompletedModules
  >[0]
}

describe('countDistinctCompletedModules', () => {
  it('counts unique module_id values only', async () => {
    const admin = mockAdmin([
      { module_id: 'a' },
      { module_id: 'a' },
      { module_id: 'b' },
      { module_id: null },
    ])
    await expect(countDistinctCompletedModules(admin, 'user-1', 'course-1')).resolves.toBe(2)
  })
})

describe('pathMandatoryCoursesCompleted', () => {
  it('returns false when no mandatory courses in sequence', async () => {
    const admin = { from: vi.fn() } as unknown as Parameters<typeof pathMandatoryCoursesCompleted>[0]
    await expect(
      pathMandatoryCoursesCompleted(admin, 'user-1', [{ course_id: 'c1', is_mandatory: false }]),
    ).resolves.toBe(false)
  })

  it('returns true when all mandatory enrollments are completed', async () => {
    const chain = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      in: vi.fn().mockResolvedValue({
        data: [
          { course_id: 'c1', status: 'completed' },
          { course_id: 'c2', status: 'completed' },
        ],
      }),
    }
    const admin = { from: vi.fn().mockReturnValue(chain) } as unknown as Parameters<
      typeof pathMandatoryCoursesCompleted
    >[0]

    await expect(
      pathMandatoryCoursesCompleted(admin, 'user-1', [
        { course_id: 'c1', is_mandatory: true },
        { course_id: 'c2', is_mandatory: true },
      ]),
    ).resolves.toBe(true)
  })
})

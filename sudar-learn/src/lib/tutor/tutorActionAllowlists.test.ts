import { describe, expect, it } from 'vitest'
import { buildTutorActionAllowlists } from '@/lib/tutor/tutorActionAllowlists'

describe('buildTutorActionAllowlists', () => {
  it('includes active course id even when catalog and enrollments are empty (in-course tutor thread)', () => {
    const active = 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee'
    const { allowedCourseIds, allowedPathIds, enrollmentByCourseId } = buildTutorActionAllowlists({
      catalogCourseIds: [],
      pathIds: [],
      enrollments: [],
      activeCourseId: active,
    })
    expect(allowedCourseIds.has(active)).toBe(true)
    expect(allowedPathIds.size).toBe(0)
    expect(enrollmentByCourseId.size).toBe(0)
  })

  it('adds enrolled courses to allowed ids even if they are not in the catalog slice', () => {
    const enrolledId = '11111111-2222-3333-4444-555555555555'
    const { allowedCourseIds, enrollmentByCourseId } = buildTutorActionAllowlists({
      catalogCourseIds: ['aaaaaaaa-bbbb-cccc-dddd-000000000001'],
      pathIds: [],
      enrollments: [{ course_id: enrolledId, status: 'active', progress_pct: 12 }],
      activeCourseId: null,
    })
    expect(allowedCourseIds.has(enrolledId)).toBe(true)
    expect(enrollmentByCourseId.get(enrolledId)?.status).toBe('active')
  })

  it('registers path ids from the published paths list', () => {
    const pid = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'
    const { allowedPathIds } = buildTutorActionAllowlists({
      catalogCourseIds: [],
      pathIds: [pid],
      enrollments: [],
      activeCourseId: null,
    })
    expect(allowedPathIds.has(pid)).toBe(true)
  })
})

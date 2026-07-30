import { describe, expect, it, vi } from 'vitest'

import { computeCourseEnrollmentProgress } from '@/lib/enrollment/courseEnrollmentProgress'
import { checkPathCertificateEligibility } from '@/lib/certificates/pathCertificateEligibility'
import { redeemInviteCode } from '../../../../shared/access/inviteCodes'

describe('computeCourseEnrollmentProgress', () => {
  it('counts distinct module_ids only', async () => {
    const modulesChain = {
      select: () => ({
        eq: () => Promise.resolve({ count: 4, error: null }),
      }),
    }
    const eventsChain = {
      select: () => ({
        eq: () => ({
          eq: () => ({
            eq: () => ({
              not: () =>
                Promise.resolve({
                  data: [
                    { module_id: 'mod-a' },
                    { module_id: 'mod-a' },
                    { module_id: 'mod-b' },
                  ],
                  error: null,
                }),
            }),
          }),
        }),
      }),
    }

    const mockAdmin = {
      from(table: string) {
        if (table === 'modules') return modulesChain
        if (table === 'learning_events') return eventsChain
        throw new Error(`unexpected table ${table}`)
      },
    } as never

    const result = await computeCourseEnrollmentProgress(mockAdmin, 'user-1', 'course-1')
    expect(result).toEqual({
      progress: 50,
      status: 'in_progress',
      totalModules: 4,
      completedModules: 2,
    })
  })
})

describe('checkPathCertificateEligibility', () => {
  it('requires completed mandatory courses only', async () => {
    let enrollmentsQuery = 0
    const mockAdmin = {
      from(table: string) {
        if (table === 'enrollments') {
          enrollmentsQuery += 1
          if (enrollmentsQuery === 1) {
            return {
              select: () => ({
                eq: () => ({
                  eq: () => ({
                    maybeSingle: async () => ({
                      data: {
                        id: 'enroll-1',
                        personalized_sequence: [
                          { course_id: 'course-a', is_mandatory: true },
                          { course_id: 'course-b', is_mandatory: false },
                        ],
                      },
                    }),
                  }),
                }),
              }),
            }
          }
          return {
            select: () => ({
              eq: () => ({
                in: async () => ({
                  data: [
                    { course_id: 'course-a', status: 'completed' },
                    { course_id: 'course-b', status: 'in_progress' },
                  ],
                }),
              }),
            }),
          }
        }
        throw new Error(`unexpected table ${table}`)
      },
    } as never

    const result = await checkPathCertificateEligibility(mockAdmin, 'user-1', 'path-1')
    expect(result).toEqual({ eligible: true })
  })

  it('rejects learners who are not path-enrolled', async () => {
    const mockAdmin = {
      from: () => ({
        select: () => ({
          eq: () => ({
            eq: () => ({
              maybeSingle: async () => ({ data: null }),
            }),
          }),
        }),
      }),
    } as never

    const result = await checkPathCertificateEligibility(mockAdmin, 'user-1', 'path-1')
    expect(result).toEqual({ eligible: false, reason: 'not_enrolled' })
  })
})

describe('redeemInviteCode', () => {
  it('does not increment when profile already has the invite code', async () => {
    const update = vi.fn()
    const mockSupabase = {
      from: () => ({
        select: () => ({
          eq: () => ({
            maybeSingle: async () => ({ data: { signup_code_used: 'EARLY_TALISMA' } }),
          }),
        }),
        update,
      }),
    } as never

    const result = await redeemInviteCode(mockSupabase, 'user-1', 'early_talisma')
    expect(result).toEqual({ ok: true })
    expect(update).not.toHaveBeenCalled()
  })
})

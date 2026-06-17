import { afterEach, describe, expect, it } from 'vitest'
import { NextRequest } from 'next/server'

import { authorizeInternalService } from '@/lib/security/internalServiceAuth'
import { computeCourseEnrollmentProgress } from '@/lib/enrollment/courseEnrollmentProgress'
import { checkPathCertificateEligibility } from '@/lib/certificates/pathCertificateEligibility'

describe('authorizeInternalService', () => {
  const originalSecret = process.env.INTERNAL_SERVICE_SECRET

  afterEach(() => {
    if (originalSecret === undefined) {
      delete process.env.INTERNAL_SERVICE_SECRET
    } else {
      process.env.INTERNAL_SERVICE_SECRET = originalSecret
    }
  })

  it('rejects requests without a configured secret', () => {
    delete process.env.INTERNAL_SERVICE_SECRET
    const request = new NextRequest('http://localhost/api/coins/earn', {
      headers: { authorization: 'Bearer anything' },
    })
    expect(authorizeInternalService(request)).toBe(false)
  })

  it('accepts matching bearer tokens', () => {
    process.env.INTERNAL_SERVICE_SECRET = 'test-secret'
    const request = new NextRequest('http://localhost/api/coins/earn', {
      headers: { authorization: 'Bearer test-secret' },
    })
    expect(authorizeInternalService(request)).toBe(true)
  })

  it('rejects mismatched bearer tokens', () => {
    process.env.INTERNAL_SERVICE_SECRET = 'test-secret'
    const request = new NextRequest('http://localhost/api/coins/earn', {
      headers: { authorization: 'Bearer wrong' },
    })
    expect(authorizeInternalService(request)).toBe(false)
  })
})

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
    const mockAdmin = {
      from(table: string) {
        if (table === 'enrollments') {
          return {
            select: () => ({
              eq: (column: string) => {
                if (column === 'user_id') {
                  return {
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
                  }
                }
                if (column === 'course_id') {
                  return {
                    in: async () => ({
                      data: [
                        { course_id: 'course-a', status: 'completed' },
                        { course_id: 'course-b', status: 'in_progress' },
                      ],
                    }),
                  }
                }
                throw new Error(`unexpected eq column ${column}`)
              },
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

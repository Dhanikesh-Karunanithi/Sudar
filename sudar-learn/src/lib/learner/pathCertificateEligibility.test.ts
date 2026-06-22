import { describe, expect, it, vi } from 'vitest'

import { isLearnerEligibleForPathCertificate } from './pathCertificateEligibility'

describe('isLearnerEligibleForPathCertificate', () => {
  it('rejects when mandatory courses are not all completed', async () => {
    const admin = {
      from: vi.fn((table: string) => {
        if (table === 'enrollments') {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                eq: vi.fn(() => ({
                  maybeSingle: vi.fn().mockResolvedValue({
                    data: {
                      id: 'pe-1',
                      personalized_sequence: [
                        { course_id: 'c1', is_mandatory: true },
                        { course_id: 'c2', is_mandatory: true },
                      ],
                      status: 'in_progress',
                    },
                  }),
                })),
                in: vi.fn(() =>
                  Promise.resolve({
                    data: [
                      { course_id: 'c1', status: 'completed' },
                      { course_id: 'c2', status: 'in_progress' },
                    ],
                  }),
                ),
              })),
            })),
          }
        }
        return { select: vi.fn() }
      }),
    }

    const result = await isLearnerEligibleForPathCertificate(admin as never, 'user-1', 'path-1')
    expect(result).toEqual({
      eligible: false,
      reason: 'Mandatory path courses are not all completed',
    })
  })

  it('allows when all mandatory courses are completed', async () => {
    const admin = {
      from: vi.fn((table: string) => {
        if (table === 'enrollments') {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                eq: vi.fn(() => ({
                  maybeSingle: vi.fn().mockResolvedValue({
                    data: {
                      id: 'pe-1',
                      personalized_sequence: [{ course_id: 'c1', is_mandatory: true }],
                      status: 'in_progress',
                    },
                  }),
                })),
                in: vi.fn(() =>
                  Promise.resolve({
                    data: [{ course_id: 'c1', status: 'completed' }],
                  }),
                ),
              })),
            })),
          }
        }
        return { select: vi.fn() }
      }),
    }

    const result = await isLearnerEligibleForPathCertificate(admin as never, 'user-1', 'path-1')
    expect(result).toEqual({ eligible: true })
  })
})

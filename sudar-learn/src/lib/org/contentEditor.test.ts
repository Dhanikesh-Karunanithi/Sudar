import { describe, expect, it } from 'vitest'
import { userCanEditOrgContent } from './contentEditor'

describe('userCanEditOrgContent', () => {
  it('allows ADMIN, MANAGER, and CREATOR', async () => {
    for (const role of ['ADMIN', 'MANAGER', 'CREATOR'] as const) {
      const supabase = {
        from: () => ({
          select: () => ({
            eq: () => ({
              eq: () => ({
                maybeSingle: async () => ({ data: { role } }),
              }),
            }),
          }),
        }),
      }
      await expect(
        userCanEditOrgContent(supabase as never, 'user-1', 'org-1'),
      ).resolves.toBe(true)
    }
  })

  it('denies LEARNER and missing membership', async () => {
    const learnerClient = {
      from: () => ({
        select: () => ({
          eq: () => ({
            eq: () => ({
              maybeSingle: async () => ({ data: { role: 'LEARNER' } }),
            }),
          }),
        }),
      }),
    }
    await expect(
      userCanEditOrgContent(learnerClient as never, 'user-1', 'org-1'),
    ).resolves.toBe(false)

    const noMemberClient = {
      from: () => ({
        select: () => ({
          eq: () => ({
            eq: () => ({
              maybeSingle: async () => ({ data: null }),
            }),
          }),
        }),
      }),
    }
    await expect(
      userCanEditOrgContent(noMemberClient as never, 'user-1', 'org-1'),
    ).resolves.toBe(false)
  })
})

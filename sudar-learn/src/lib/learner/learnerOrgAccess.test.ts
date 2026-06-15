import { describe, expect, it, vi } from 'vitest'

import { learnerBelongsToOrg } from '@/lib/learner/learnerOrgAccess'

function makeAdmin(profileOrgId: string | null, memberRow: { id: string } | null) {
  const from = vi.fn((table: string) => {
    if (table === 'profiles') {
      return {
        select: () => ({
          eq: () => ({
            maybeSingle: async () => ({ data: profileOrgId ? { org_id: profileOrgId } : { org_id: null } }),
          }),
        }),
      }
    }
    if (table === 'org_members') {
      return {
        select: () => ({
          eq: () => ({
            eq: () => ({
              maybeSingle: async () => ({ data: memberRow }),
            }),
          }),
        }),
      }
    }
    throw new Error(`unexpected table ${table}`)
  })
  return { from } as unknown as ReturnType<typeof import('@/lib/supabase/server').createServiceRoleSupabaseClient>
}

describe('learnerBelongsToOrg', () => {
  it('returns true when profile org matches', async () => {
    const admin = makeAdmin('org-a', null)
    await expect(learnerBelongsToOrg(admin, 'user-1', 'org-a')).resolves.toBe(true)
  })

  it('returns true when org_members row exists', async () => {
    const admin = makeAdmin(null, { id: 'm1' })
    await expect(learnerBelongsToOrg(admin, 'user-1', 'org-b')).resolves.toBe(true)
  })

  it('returns false when learner is not in the org', async () => {
    const admin = makeAdmin('org-a', null)
    await expect(learnerBelongsToOrg(admin, 'user-1', 'org-b')).resolves.toBe(false)
  })
})

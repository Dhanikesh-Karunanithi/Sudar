import { describe, expect, it, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

const mockGetUser = vi.fn()
const mockUpdateUser = vi.fn()
const mockFrom = vi.fn()
const mockCreateClient = vi.fn(() => ({
  auth: {
    getUser: mockGetUser,
    updateUser: mockUpdateUser,
  },
}))
const mockCreateServiceRoleSupabaseClient = vi.fn(() => ({
  from: mockFrom,
}))

vi.mock('@/lib/supabase/server', () => ({
  createClient: mockCreateClient,
  createServiceRoleSupabaseClient: mockCreateServiceRoleSupabaseClient,
}))

describe('POST /api/auth/complete-password-change', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.resetModules()
  })

  function profileChain(requirePasswordChange: boolean) {
    return {
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          maybeSingle: vi.fn().mockResolvedValue({
            data: { require_password_change: requirePasswordChange },
          }),
        }),
      }),
      update: vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ error: null }),
      }),
    }
  }

  it('rejects unauthenticated requests', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } })
    const { POST } = await import('./route')
    const res = await POST(
      new NextRequest('http://localhost/api/auth/complete-password-change', {
        method: 'POST',
        body: JSON.stringify({ password: 'newpassword1' }),
      }),
    )
    expect(res.status).toBe(401)
  })

  it('rejects empty body so the flag cannot be cleared without a password', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'user-1' } } })
    mockFrom.mockReturnValue(profileChain(true))
    const { POST } = await import('./route')
    const res = await POST(
      new NextRequest('http://localhost/api/auth/complete-password-change', {
        method: 'POST',
        body: JSON.stringify({}),
      }),
    )
    expect(res.status).toBe(400)
    expect(mockUpdateUser).not.toHaveBeenCalled()
  })

  it('rejects when password change is not required', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'user-1' } } })
    mockFrom.mockReturnValue(profileChain(false))
    const { POST } = await import('./route')
    const res = await POST(
      new NextRequest('http://localhost/api/auth/complete-password-change', {
        method: 'POST',
        body: JSON.stringify({ password: 'newpassword1' }),
      }),
    )
    expect(res.status).toBe(400)
    expect(mockUpdateUser).not.toHaveBeenCalled()
  })

  it('updates password server-side before clearing require_password_change', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'user-1' } } })
    mockUpdateUser.mockResolvedValue({ error: null })
    const chain = profileChain(true)
    mockFrom.mockReturnValue(chain)
    const { POST } = await import('./route')
    const res = await POST(
      new NextRequest('http://localhost/api/auth/complete-password-change', {
        method: 'POST',
        body: JSON.stringify({ password: 'newpassword1' }),
      }),
    )
    expect(res.status).toBe(200)
    expect(mockUpdateUser).toHaveBeenCalledWith({ password: 'newpassword1' })
    expect(chain.update).toHaveBeenCalled()
  })
})

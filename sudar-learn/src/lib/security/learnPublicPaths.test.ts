import { describe, expect, it } from 'vitest'

import { isLearnPublicPath } from '@/lib/security/learnPublicPaths'

describe('isLearnPublicPath', () => {
  it('allows auth and recovery routes without a session', () => {
    expect(isLearnPublicPath('/login')).toBe(true)
    expect(isLearnPublicPath('/signup')).toBe(true)
    expect(isLearnPublicPath('/forgot-password')).toBe(true)
    expect(isLearnPublicPath('/auth/callback')).toBe(true)
  })

  it('blocks protected learner routes', () => {
    expect(isLearnPublicPath('/')).toBe(false)
    expect(isLearnPublicPath('/courses/abc')).toBe(false)
    expect(isLearnPublicPath('/reset-password')).toBe(false)
  })
})

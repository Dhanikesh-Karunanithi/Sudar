import { describe, expect, it } from 'vitest'

import { isLearnPublicPath } from '@/lib/security/learnPublicPaths'

describe('isLearnPublicPath', () => {
  it('allows auth, notifications, and ALP API prefixes without a browser session', () => {
    expect(isLearnPublicPath('/login')).toBe(true)
    expect(isLearnPublicPath('/signup')).toBe(true)
    expect(isLearnPublicPath('/auth/callback')).toBe(true)
    expect(isLearnPublicPath('/api/notifications/unsubscribe')).toBe(true)
    expect(isLearnPublicPath('/api/notifications/track')).toBe(true)
    expect(isLearnPublicPath('/api/alp/events')).toBe(true)
    expect(isLearnPublicPath('/api/alp/embed-token')).toBe(true)
  })

  it('allows Intelligence agent-tool and cron prefixes for server-to-server callers', () => {
    expect(isLearnPublicPath('/api/internal/agent-tools/next-best-action')).toBe(true)
    expect(isLearnPublicPath('/api/cron/agent-spacing-nudges')).toBe(true)
  })

  it('allows ALP embed iframe routes', () => {
    expect(isLearnPublicPath('/alp/embed')).toBe(true)
    expect(isLearnPublicPath('/alp/embed/')).toBe(true)
  })

  it('does not expose arbitrary dashboard or API routes', () => {
    expect(isLearnPublicPath('/')).toBe(false)
    expect(isLearnPublicPath('/dashboard')).toBe(false)
    expect(isLearnPublicPath('/api/tutor/query')).toBe(false)
    expect(isLearnPublicPath('/api/alp')).toBe(false)
  })
})

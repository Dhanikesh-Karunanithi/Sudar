import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { isLearnApiDelegatedAuthPath } from './learnPublicPaths'

describe('isLearnApiDelegatedAuthPath', () => {
  const secret = 'test-sim-service-secret-value'

  beforeEach(() => {
    vi.stubEnv('SUDAR_SIM_SERVICE_SECRET', secret)
  })

  afterEach(() => {
    vi.unstubAllEnvs()
  })

  const withValidSecret = new Headers({ 'x-sudar-sim-secret': secret })
  const withForgedSecret = new Headers({ 'x-sudar-sim-secret': 'anything' })

  it('delegates the sim agent context route', () => {
    expect(isLearnApiDelegatedAuthPath('/api/sim/session/abc/agent')).toBe(true)
  })

  it('delegates sim session sync only when the sim service secret is valid', () => {
    expect(isLearnApiDelegatedAuthPath('/api/sim/session/abc', withValidSecret)).toBe(true)
    expect(isLearnApiDelegatedAuthPath('/api/sim/session/abc', withForgedSecret)).toBe(false)
    expect(isLearnApiDelegatedAuthPath('/api/sim/session/abc')).toBe(false)
  })

  it('keeps other sim and API routes behind the session gate', () => {
    expect(isLearnApiDelegatedAuthPath('/api/sim/session', withValidSecret)).toBe(false)
    expect(isLearnApiDelegatedAuthPath('/api/sim/session/abc/voice', withValidSecret)).toBe(false)
    expect(isLearnApiDelegatedAuthPath('/api/tutor/query', withForgedSecret)).toBe(false)
  })
})

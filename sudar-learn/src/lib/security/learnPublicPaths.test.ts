import { describe, expect, it } from 'vitest'

import { isLearnApiDelegatedAuthPath } from './learnPublicPaths'

describe('isLearnApiDelegatedAuthPath', () => {
  const withSecret = new Headers({ 'x-sudar-sim-secret': 'anything' })

  it('delegates the sim agent context route', () => {
    expect(isLearnApiDelegatedAuthPath('/api/sim/session/abc/agent')).toBe(true)
  })

  it('delegates sim session sync only when the agent secret header is present', () => {
    expect(isLearnApiDelegatedAuthPath('/api/sim/session/abc', withSecret)).toBe(true)
    expect(isLearnApiDelegatedAuthPath('/api/sim/session/abc')).toBe(false)
  })

  it('keeps other sim and API routes behind the session gate', () => {
    expect(isLearnApiDelegatedAuthPath('/api/sim/session', withSecret)).toBe(false)
    expect(isLearnApiDelegatedAuthPath('/api/sim/session/abc/voice', withSecret)).toBe(false)
    expect(isLearnApiDelegatedAuthPath('/api/tutor/query', withSecret)).toBe(false)
  })
})

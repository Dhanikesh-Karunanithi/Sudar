import { describe, expect, it } from 'vitest'

import { formatInviterDisplayName } from './inviteEmailPersonalization'

describe('formatInviterDisplayName', () => {
  it('uses first name from full name', () => {
    expect(formatInviterDisplayName('Dhanikesh Karunanithi', 'd@co.com')).toBe('Dhanikesh')
  })

  it('falls back to email local part', () => {
    expect(formatInviterDisplayName(null, 'alex@company.com')).toBe('alex')
  })

  it('returns null when nothing usable', () => {
    expect(formatInviterDisplayName('', '')).toBeNull()
    expect(formatInviterDisplayName(undefined, undefined)).toBeNull()
  })
})

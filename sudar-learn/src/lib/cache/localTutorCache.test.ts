import { describe, expect, it } from 'vitest'
import {
  DEFAULT_THREAD_TITLE,
  threadDateGroupLabel,
  titleFromFirstUserMessage,
} from '@/lib/cache/localTutorCache'

describe('titleFromFirstUserMessage', () => {
  it('returns default for empty', () => {
    expect(titleFromFirstUserMessage('')).toBe(DEFAULT_THREAD_TITLE)
    expect(titleFromFirstUserMessage('   ')).toBe(DEFAULT_THREAD_TITLE)
  })

  it('uses short messages as title', () => {
    expect(titleFromFirstUserMessage('Teach me GitHub')).toBe('Teach me GitHub')
  })

  it('truncates long messages', () => {
    const long = 'Please explain how branching works in Git and GitHub in a simple way for beginners'
    const title = titleFromFirstUserMessage(long)
    expect(title.endsWith('…')).toBe(true)
    expect(title.length).toBeLessThanOrEqual(48)
  })
})

describe('threadDateGroupLabel', () => {
  it('groups relative to today', () => {
    const now = new Date('2026-07-26T12:00:00.000Z')
    expect(threadDateGroupLabel('2026-07-26T08:00:00.000Z', now)).toBe('Today')
    expect(threadDateGroupLabel('2026-07-25T08:00:00.000Z', now)).toBe('Yesterday')
    expect(threadDateGroupLabel('2026-07-20T08:00:00.000Z', now)).toBe('Previous 7 days')
    expect(threadDateGroupLabel('2026-06-01T08:00:00.000Z', now)).toBe('Older')
  })
})

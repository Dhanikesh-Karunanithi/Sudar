import { describe, expect, it } from 'vitest'
import { sanitizeNotebookSnapshot } from './notebookStorage'
import { JOURNEY_NOTEBOOK_MAX_PAGES } from '@/types/journeyNotebook'

const wm = { goal: 'Learn SQL joins', active_concept: null, open_questions: [], known: [], gaps: [] }

describe('sanitizeNotebookSnapshot', () => {
  it('keeps valid pages and drops malformed ones', () => {
    const snap = sanitizeNotebookSnapshot({
      pages: [
        { id: 'a', createdAt: 1, source: 'note', noteText: 'hi', status: 'accepted' },
        { id: 'b', createdAt: 2, source: 'hacker' },
        { id: 'c', createdAt: 'nope', source: 'note' },
        null,
      ],
      working_memory: wm,
    })
    expect(snap.pages.map((p) => p.id)).toEqual(['a'])
    expect(snap.working_memory.goal).toBe('Learn SQL joins')
    expect(snap.session).toBeNull()
  })

  it('caps page count to the most recent pages', () => {
    const pages = Array.from({ length: JOURNEY_NOTEBOOK_MAX_PAGES + 5 }, (_, i) => ({
      id: `p${i}`,
      createdAt: i,
      source: 'note',
    }))
    const snap = sanitizeNotebookSnapshot({ pages, working_memory: wm })
    expect(snap.pages).toHaveLength(JOURNEY_NOTEBOOK_MAX_PAGES)
    expect(snap.pages[0]?.id).toBe('p5')
  })

  it('falls back to empty working memory on garbage', () => {
    const snap = sanitizeNotebookSnapshot({ pages: 'x', working_memory: { goal: 5 } })
    expect(snap.pages).toEqual([])
    expect(snap.working_memory.open_questions).toEqual([])
  })

  it('keeps a valid session', () => {
    const session = {
      mode: 'socratic',
      turns_since_check: 1,
      substantive_turn_count: 3,
      intake_complete: true,
      working_memory: wm,
    }
    const snap = sanitizeNotebookSnapshot({ pages: [], working_memory: wm, session })
    expect(snap.session?.mode).toBe('socratic')
  })
})

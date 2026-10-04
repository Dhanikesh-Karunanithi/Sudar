import { describe, expect, it } from 'vitest'
import {
  htmlToReadableMarkdown,
  normalizeTutorDisplayText,
  textLooksLikeHtml,
} from '@/lib/tutor/normalizeTutorDisplayText'
import { ensureJourneyNotebookBlocks } from '@/lib/tutor/ensureJourneyNotebookBlocks'

describe('normalizeTutorDisplayText', () => {
  it('detects html lessons', () => {
    expect(textLooksLikeHtml('<h2>Git</h2><p>Hello</p>')).toBe(true)
    expect(textLooksLikeHtml('## Git\n\nHello')).toBe(false)
  })

  it('converts html to readable markdown', () => {
    const md = htmlToReadableMarkdown(
      '<h2>Branching</h2><p>Create a branch with <code>git checkout -b</code>.</p><ul><li>One</li><li>Two</li></ul>',
    )
    expect(md).toContain('## Branching')
    expect(md).toContain('`git checkout -b`')
    expect(md).toContain('- One')
    expect(md).not.toMatch(/<h2>/)
  })

  it('leaves clean markdown alone', () => {
    const src = '### Tip\n\nUse **bold** and `code`.'
    expect(normalizeTutorDisplayText(src)).toBe(src)
  })
})

describe('ensureJourneyNotebookBlocks', () => {
  it('synthesizes lesson_html when allowAutoLesson and body is html', () => {
    const html = '<h2>GitHub Basics</h2><p>Clone a repo, then push a commit.</p>'
    const out = ensureJourneyNotebookBlocks(html, [], { allowAutoLesson: true })
    expect(out.blocks.some((b) => b.type === 'lesson_html')).toBe(true)
    expect(out.responseText).not.toMatch(/<h2>/)
    expect(out.responseText.length).toBeLessThan(html.length + 20)
  })

  it('does not auto-synthesize for SudarNotes (allowAutoLesson false)', () => {
    const html = '<h2>GitHub Basics</h2><p>Clone a repo, then push a commit.</p>'
    const out = ensureJourneyNotebookBlocks(html, [], { allowAutoLesson: false })
    expect(out.blocks.some((b) => b.type === 'lesson_html')).toBe(false)
  })

  it('keeps existing lesson_html and shortens chat', () => {
    const long = `<h2>Long</h2><p>${'word '.repeat(80)}</p>`
    const out = ensureJourneyNotebookBlocks(long, [
      {
        id: 'l1',
        type: 'lesson_html',
        payload: { title: 'Long', html: '<p>ok</p>' },
      },
    ])
    expect(out.blocks).toHaveLength(1)
    expect(out.blocks[0]?.type).toBe('lesson_html')
    expect(out.responseText).not.toMatch(/<h2>/)
  })
})

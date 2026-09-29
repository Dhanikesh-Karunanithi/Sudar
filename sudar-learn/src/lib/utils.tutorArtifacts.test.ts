import { describe, expect, it } from 'vitest'
import {
  safeNotebookPreview,
  stripTutorModelArtifactsFromText,
} from '@/lib/utils'

describe('stripTutorModelArtifactsFromText', () => {
  it('strips BLOCKS tails', () => {
    const out = stripTutorModelArtifactsFromText(
      'Here is a short lesson.\nBLOCKS: [{"id":"l1","type":"lesson_html","payload":{}}]',
    )
    expect(out).toBe('Here is a short lesson.')
  })

  it('strips trailing raw JSON block arrays', () => {
    const out = stripTutorModelArtifactsFromText(
      'Ok.\n[{"id":"l1","type":"lesson_html","payload":{"title":"X"}}]',
    )
    expect(out).toBe('Ok.')
  })
})

describe('safeNotebookPreview', () => {
  it('hides JSON / BLOCKS previews', () => {
    expect(safeNotebookPreview('{"id":"l1","type":"lesson_html"}')).toBe('')
    expect(safeNotebookPreview('BLOCKS: []')).toBe('')
  })

  it('keeps plain prose', () => {
    expect(safeNotebookPreview('GitHub Basics in plain English')).toContain('GitHub')
  })
})

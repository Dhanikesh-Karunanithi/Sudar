import { describe, expect, it } from 'vitest'
import { mimeToKbFileType } from '../../../../shared/knowledge-base/fileTypes'

describe('mimeToKbFileType', () => {
  it('maps pdf mime', () => {
    expect(mimeToKbFileType('application/pdf', 'handbook.pdf')).toBe('pdf')
  })

  it('maps docx by extension', () => {
    expect(mimeToKbFileType('application/octet-stream', 'policy.docx')).toBe('docx')
  })
})

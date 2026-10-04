import { describe, expect, it } from 'vitest'
import { COURSE_TEMPLATES, getCourseTemplate } from '@/lib/courseTemplates'

describe('courseTemplates', () => {
  it('exposes required presets', () => {
    const ids = new Set(COURSE_TEMPLATES.map((t) => t.id))
    expect(ids.has('structured_lesson')).toBe(true)
    expect(ids.has('interactive_lesson')).toBe(true)
    expect(ids.has('compliance_sop')).toBe(true)
  })

  it('falls back to structured lesson for unknown ids', () => {
    expect(getCourseTemplate('does_not_exist').id).toBe('structured_lesson')
  })
})

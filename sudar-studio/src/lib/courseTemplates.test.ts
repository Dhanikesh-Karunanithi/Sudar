import test from 'node:test'
import assert from 'node:assert/strict'
import { COURSE_TEMPLATES, getCourseTemplate } from '@/lib/courseTemplates'

test('course templates expose required presets', () => {
  const ids = new Set(COURSE_TEMPLATES.map((t) => t.id))
  assert.ok(ids.has('structured_lesson'))
  assert.ok(ids.has('interactive_lesson'))
  assert.ok(ids.has('compliance_sop'))
})

test('template resolver falls back to structured lesson', () => {
  const resolved = getCourseTemplate('does_not_exist')
  assert.equal(resolved.id, 'structured_lesson')
})

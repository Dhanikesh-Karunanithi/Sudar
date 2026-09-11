import assert from 'node:assert/strict'
import test from 'node:test'
import { ensureStudioUrl, parseObject, withStudioDirective, formatChatGptCourseDeliverable } from './creatorFormat.ts'

test('parseObject accepts objects only', () => {
  assert.equal(parseObject('[]'), null)
  assert.deepEqual(parseObject('{"course_id":"abc"}'), { course_id: 'abc' })
})

test('ensureStudioUrl fills missing editor link', () => {
  const out = ensureStudioUrl({ course_id: 'c1' }, 'https://studio.thesudar.com/')
  assert.equal(out.studio_url, 'https://studio.thesudar.com/courses/c1')
})

test('withStudioDirective forbids substitute outlines on failure', () => {
  const text = withStudioDirective(false, '{"error":"nope"}')
  assert.match(text, /Do not write a substitute course outline/)
})

test('formatChatGptCourseDeliverable keeps the user in chat while generating', () => {
  const text = formatChatGptCourseDeliverable({
    title: 'Generative AI',
    course_id: '11111111-1111-1111-1111-111111111111',
    remaining_empty: 2,
    package_url: 'https://studio.thesudar.com/share/p/abc',
    studio_url: 'https://studio.thesudar.com/courses/11111111-1111-1111-1111-111111111111',
  })
  assert.match(text, /Stay in this chat/)
  assert.match(text, /sudar_build_course again with course_id/)
  assert.match(text, /Learner package/)
  assert.match(text, /Optional later/)
})

test('formatChatGptCourseDeliverable pastes HTML and optional Studio last', () => {
  const text = formatChatGptCourseDeliverable({
    title: 'Generative AI',
    course_id: '11111111-1111-1111-1111-111111111111',
    remaining_empty: 0,
    generation_completed: true,
    package_url: 'https://studio.thesudar.com/share/p/abc',
    html_url: 'https://studio.thesudar.com/api/share/packages/abc?format=html',
    scorm_url: 'https://studio.thesudar.com/api/share/packages/abc?format=scorm-1.2',
    studio_url: 'https://studio.thesudar.com/courses/11111111-1111-1111-1111-111111111111',
    html: {
      modules: [{ title: 'Foundations', html: '<html><body>Hello</body></html>' }],
    },
  })
  assert.match(text, /Download SCORM 1\.2 ZIP/)
  assert.match(text, /```html/)
  assert.match(text, /Hello/)
  assert.match(text, /Optional: host, publish/)
  assert.doesNotMatch(text, /zip_base64/)
})

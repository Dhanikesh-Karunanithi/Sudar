import assert from 'node:assert/strict'
import test from 'node:test'
import { ensureStudioUrl, parseObject, withStudioDirective } from './creatorFormat.ts'

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

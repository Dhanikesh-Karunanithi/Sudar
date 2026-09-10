import assert from 'node:assert/strict'
import test from 'node:test'
import { isRetryableFillError, shouldContinueFill } from './courseFillLogic.ts'

test('isRetryableFillError matches Cloudflare Worker limits', () => {
  assert.equal(
    isRetryableFillError('Failed to save module "X": Too many subrequests by single Worker invocation.'),
    true,
  )
  assert.equal(isRetryableFillError('Unauthorized'), false)
})

test('shouldContinueFill follows 202 needs_continue', () => {
  assert.equal(
    shouldContinueFill({ course_id: 'c1', needs_continue: true, completed: false }, 202),
    true,
  )
  assert.equal(shouldContinueFill({ course_id: 'c1', completed: true }, 200), false)
  assert.equal(shouldContinueFill({ course_id: 'c1', error: 'Unauthorized' }, 401), false)
})

import test from 'node:test'
import assert from 'node:assert/strict'
import { isUniqueConstraintError, personalWorkspaceSlug } from './orgHelpers.ts'

test('personalWorkspaceSlug uses the first 8 characters of the user id', () => {
  assert.equal(
    personalWorkspaceSlug('abcdef12-3456-7890-abcd-ef1234567890'),
    'workspace-abcdef12'
  )
})

test('isUniqueConstraintError matches Postgres unique violations', () => {
  assert.equal(isUniqueConstraintError({ code: '23505', message: 'duplicate key' }), true)
  assert.equal(
    isUniqueConstraintError({
      message: 'duplicate key value violates unique constraint "organisations_slug_key"',
    }),
    true
  )
  assert.equal(isUniqueConstraintError({ code: '42501', message: 'permission denied' }), false)
  assert.equal(isUniqueConstraintError(null), false)
})

import test from 'node:test'
import assert from 'node:assert/strict'
import { STUDIO_ACTION_TYPES } from '@/lib/agent/types'

test('studio action types include authoring actions', () => {
  assert.ok(STUDIO_ACTION_TYPES.includes('draft_module_content'))
  assert.ok(STUDIO_ACTION_TYPES.includes('apply_module_content'))
})

import { describe, expect, it } from 'vitest'
import { STUDIO_ACTION_TYPES } from '@/lib/agent/types'

describe('STUDIO_ACTION_TYPES', () => {
  it('includes authoring actions', () => {
    expect(STUDIO_ACTION_TYPES).toContain('draft_module_content')
    expect(STUDIO_ACTION_TYPES).toContain('apply_module_content')
  })
})

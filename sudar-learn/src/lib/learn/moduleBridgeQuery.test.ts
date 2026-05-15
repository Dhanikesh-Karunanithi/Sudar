import { describe, expect, it } from 'vitest'
import { moduleBridgeQuerySchema } from './moduleBridgeQuery'

describe('moduleBridgeQuerySchema', () => {
  it('accepts two UUIDs', () => {
    const r = moduleBridgeQuerySchema.safeParse({
      course_id: '00000000-0000-4000-8000-000000000001',
      module_id: '00000000-0000-4000-8000-000000000002',
    })
    expect(r.success).toBe(true)
  })

  it('rejects non-UUID course_id', () => {
    const r = moduleBridgeQuerySchema.safeParse({
      course_id: 'not-a-uuid',
      module_id: '00000000-0000-4000-8000-000000000002',
    })
    expect(r.success).toBe(false)
  })

  it('rejects null values', () => {
    const r = moduleBridgeQuerySchema.safeParse({
      course_id: null,
      module_id: '00000000-0000-4000-8000-000000000002',
    })
    expect(r.success).toBe(false)
  })
})

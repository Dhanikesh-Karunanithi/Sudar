import { describe, expect, it } from 'vitest'
import { moduleBridgeQuerySchema } from '@/lib/learn/moduleBridgeQuerySchema'

describe('moduleBridgeQuerySchema', () => {
  it('accepts valid UUID pair', () => {
    const r = moduleBridgeQuerySchema.safeParse({
      course_id: '550e8400-e29b-41d4-a716-446655440000',
      module_id: '6ba7b810-9dad-11d1-80b4-00c04fd430c8',
    })
    expect(r.success).toBe(true)
  })

  it('rejects non-UUID course_id', () => {
    const r = moduleBridgeQuerySchema.safeParse({
      course_id: 'not-a-uuid',
      module_id: '6ba7b810-9dad-11d1-80b4-00c04fd430c8',
    })
    expect(r.success).toBe(false)
  })
})

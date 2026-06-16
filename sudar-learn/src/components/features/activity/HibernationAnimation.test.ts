import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import path from 'node:path'

const ROOT = __dirname

describe('HibernationAnimation', () => {
  it('defines warning and hibernating motion classes', () => {
    const source = readFileSync(
      path.join(ROOT, 'HibernationAnimation.tsx'),
      'utf8'
    )

    expect(source).toContain('animate-hibernation-warning-pulse')
    expect(source).toContain('animate-hibernation-sleep')
    expect(source).toContain('animate-zzz-float')
  })

  it('overlay uses HibernationAnimation for both inactive states', () => {
    const source = readFileSync(
      path.join(ROOT, 'InactiveHibernationOverlay.tsx'),
      'utf8'
    )

    expect(source).toContain('HibernationAnimation')
    expect(source).not.toContain('animate-[spin')
    expect(source).toContain('isWarning={isWarning}')
  })
})

import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const routeFile = join(dirname(fileURLToPath(import.meta.url)), '../../app/api/tutor/query/route.ts')

describe('tutor query route guardrail', () => {
  it('does not trust client-supplied conversation_history to skip the LLM learning-scope check', () => {
    const src = readFileSync(routeFile, 'utf8')
    expect(src).not.toMatch(/hasConversationHistory/)
  })
})

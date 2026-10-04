import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { chatWithPlatformOrCloudFallback, isModelUnavailableError } from '../../../../shared/ai/platformChat'

const ENV_KEYS = ['OPENROUTER_API_KEY', 'TOGETHER_API_KEY', 'OPENAI_API_KEY', 'ANTHROPIC_API_KEY', 'AI_CHAT_PROVIDER', 'AI_CHAT_DEFAULT_MODEL']

describe('cloud chat fallback', () => {
  const saved: Record<string, string | undefined> = {}

  beforeEach(() => {
    for (const k of ENV_KEYS) {
      saved[k] = process.env[k]
      delete process.env[k]
    }
    process.env.TOGETHER_API_KEY = 'test-key'
  })

  afterEach(() => {
    for (const k of ENV_KEYS) {
      if (saved[k] === undefined) delete process.env[k]
      else process.env[k] = saved[k]
    }
    vi.unstubAllGlobals()
  })

  it('recognises provider model-access errors', () => {
    expect(isModelUnavailableError('Unable to access non-serverless model openai/gpt-oss-20b')).toBe(true)
    expect(isModelUnavailableError('rate limit exceeded')).toBe(false)
  })

  it('retries the same provider with its default model when the pinned model is unavailable', async () => {
    const models: string[] = []
    vi.stubGlobal(
      'fetch',
      vi.fn(async (_url: string, init: { body: string }) => {
        const { model } = JSON.parse(init.body) as { model: string }
        models.push(model)
        if (model === 'openai/gpt-oss-20b') {
          return new Response(JSON.stringify({ error: { message: 'Unable to access non-serverless model' } }), { status: 400 })
        }
        return new Response(JSON.stringify({ choices: [{ message: { content: 'hello' } }] }), { status: 200 })
      })
    )

    const result = await chatWithPlatformOrCloudFallback({
      model: 'openai/gpt-oss-20b',
      messages: [{ role: 'user', content: 'hi' }],
    })

    expect(result.content).toBe('hello')
    expect(models).toEqual(['openai/gpt-oss-20b', 'meta-llama/Llama-3.3-70B-Instruct-Turbo'])
  })
})

import { createClient } from '@/lib/supabase/server'
import { requireOrgAdmin } from '@/lib/org'
import { NextResponse } from 'next/server'
import { z } from 'zod'
import { getPrivateLlmBearerToken, validateOrgPrivateServerUrl } from '@/types/orgAiInference'

const providerTestSchema = z.object({
  type: z.literal('openai_compatible_local').default('openai_compatible_local'),
  base_url: z.string().trim().min(1),
  model: z.string().trim().min(1),
  auth_mode: z.enum(['none', 'bearer']).default('none'),
  timeout_ms: z.number().int().min(1000).max(120000).default(10000),
})

function completionUrl(baseUrl: string): string {
  const base = baseUrl.replace(/\/$/, '')
  return base.endsWith('/v1') ? `${base}/chat/completions` : `${base}/v1/chat/completions`
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    await requireOrgAdmin(user.id)
  } catch {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await request.json().catch(() => null)
  const parsed = providerTestSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid provider payload', details: parsed.error.flatten() }, { status: 400 })
  }

  const check = validateOrgPrivateServerUrl(parsed.data.base_url)
  if (!check.ok) {
    return NextResponse.json({ success: false, error: check.error }, { status: 200 })
  }

  const headers: HeadersInit = { 'Content-Type': 'application/json' }
  if (parsed.data.auth_mode === 'bearer') {
    const token = getPrivateLlmBearerToken()
    if (!token) {
      return NextResponse.json(
        { success: false, error: 'Bearer auth selected but LOCAL_LLM_BEARER_TOKEN/AI_CHAT_API_KEY is not configured.' },
        { status: 200 }
      )
    }
    headers.Authorization = `Bearer ${token}`
  }

  const startedAt = Date.now()
  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), parsed.data.timeout_ms)
  try {
    const res = await fetch(completionUrl(check.normalizedBase), {
      method: 'POST',
      headers,
      signal: ctrl.signal,
      body: JSON.stringify({
        model: parsed.data.model,
        messages: [{ role: 'user', content: 'Reply with exactly: ok' }],
        max_tokens: 8,
        temperature: 0,
      }),
    })
    const latencyMs = Date.now() - startedAt
    const raw = await res.text()
    if (!res.ok) {
      return NextResponse.json({
        success: false,
        error: `Provider returned ${res.status}. ${raw.slice(0, 400)}`,
        data: { reachable: false, modelAvailable: false, latencyMs, warnings: ['provider_http_error'] },
      })
    }

    const data = JSON.parse(raw) as { choices?: Array<{ message?: { content?: string } }> }
    const sample = data.choices?.[0]?.message?.content?.trim() ?? ''
    return NextResponse.json({
      success: true,
      data: {
        reachable: true,
        modelAvailable: true,
        latencyMs,
        capabilities: ['chat', 'summarize', 'rewrite'],
        warnings: [],
        sample,
      },
    })
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Request failed'
    return NextResponse.json({
      success: false,
      error: msg.includes('abort') ? 'Connection timed out.' : msg,
      data: { reachable: false, modelAvailable: false, latencyMs: Date.now() - startedAt, warnings: ['timeout_or_network'] },
    })
  } finally {
    clearTimeout(timer)
  }
}


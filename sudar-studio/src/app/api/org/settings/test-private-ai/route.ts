import { createClient, createServiceRoleSupabaseClient } from '@/lib/supabase/server'
import { requireOrgAdmin } from '@/lib/org'
import { NextResponse } from 'next/server'
import { buildPrivateOpenAiRuntime, isOrgPrivateAiFeatureEnabled } from '@/types/orgAiInference'

/**
 * POST /api/org/settings/test-private-ai — Minimal chat completion against org private AI. Admin only.
 */
export async function POST() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let orgId: string
  try {
    orgId = await requireOrgAdmin(user.id)
  } catch {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  if (!isOrgPrivateAiFeatureEnabled()) {
    return NextResponse.json({ error: 'Private organisation AI is not enabled on this deployment.' }, { status: 403 })
  }

  const admin = createServiceRoleSupabaseClient()
  const { data: org } = await admin.from('organisations').select('settings').eq('id', orgId).single()
  const runtime = buildPrivateOpenAiRuntime(org?.settings)
  if (!runtime) {
    return NextResponse.json(
      {
        ok: false,
        error:
          'Private AI is not fully configured. Turn it on in Org settings, set server address and model, and ensure the deployment has LOCAL_LLM_BEARER_TOKEN or AI_CHAT_API_KEY.',
      },
      { status: 400 }
    )
  }

  const url = `${runtime.baseUrl.replace(/\/$/, '')}/v1/chat/completions`
  const ac = new AbortController()
  const timer = setTimeout(() => ac.abort(), 25_000)

  try {
    const res = await fetch(url, {
      method: 'POST',
      signal: ac.signal,
      headers: {
        Authorization: `Bearer ${runtime.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: runtime.defaultModel,
        messages: [{ role: 'user', content: 'Reply with exactly: ok' }],
        max_tokens: 8,
        temperature: 0,
      }),
    })
    const text = await res.text()
    if (!res.ok) {
      return NextResponse.json(
        { ok: false, error: `Server returned ${res.status}. ${text.slice(0, 500)}` },
        { status: 200 }
      )
    }
    let content = ''
    try {
      const data = JSON.parse(text) as { choices?: Array<{ message?: { content?: string } }> }
      content = data.choices?.[0]?.message?.content?.trim() ?? ''
    } catch {
      return NextResponse.json({ ok: false, error: 'Unexpected response from AI server.' }, { status: 200 })
    }
    return NextResponse.json({ ok: true, message: 'Connection successful.', sample_reply: content })
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Request failed'
    if (msg.includes('abort')) {
      return NextResponse.json({ ok: false, error: 'Connection timed out. Check the address, firewall, and that the AI app is running.' }, { status: 200 })
    }
    return NextResponse.json({ ok: false, error: msg }, { status: 200 })
  } finally {
    clearTimeout(timer)
  }
}

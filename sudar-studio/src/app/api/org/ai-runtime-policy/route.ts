import { createServiceRoleSupabaseClient, createClient } from '@/lib/supabase/server'
import { requireOrgAdmin } from '@/lib/org'
import { NextResponse } from 'next/server'
import {
  getPrivateLlmBearerToken,
  isOrgPrivateAiFeatureEnabled,
  orgAiRuntimePolicySchema,
  parseOrgAiRuntimePolicy,
  validateOrgPrivateServerUrl,
} from '@/types/orgAiInference'
import type { Json } from '@/types/database'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let orgId: string
  try {
    orgId = await requireOrgAdmin(user.id)
  } catch {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const admin = createServiceRoleSupabaseClient()
  const { data: org } = await admin.from('organisations').select('settings').eq('id', orgId).single()
  const policy = parseOrgAiRuntimePolicy(org?.settings)

  return NextResponse.json({
    success: true,
    data: {
      ...policy,
      feature_available: isOrgPrivateAiFeatureEnabled(),
      bearer_configured: Boolean(getPrivateLlmBearerToken()),
    },
  })
}

export async function PUT(request: Request) {
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
    return NextResponse.json(
      { error: 'Local BYOM mode is disabled on this deployment.' },
      { status: 403 },
    )
  }

  const body = await request.json().catch(() => null)
  const parsed = orgAiRuntimePolicySchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid ai_runtime policy', details: parsed.error.flatten() }, { status: 400 })
  }

  for (const provider of parsed.data.providers) {
    const v = validateOrgPrivateServerUrl(provider.base_url)
    if (!v.ok) return NextResponse.json({ error: `Provider "${provider.id}": ${v.error}` }, { status: 400 })
    if (provider.auth_mode === 'bearer' && !getPrivateLlmBearerToken()) {
      return NextResponse.json(
        { error: 'Bearer local provider requires deployment bearer configuration.' },
        { status: 400 },
      )
    }
  }

  const admin = createServiceRoleSupabaseClient()
  const { data: org } = await admin.from('organisations').select('settings').eq('id', orgId).single()
  const currentSettings = (org?.settings as Record<string, unknown>) ?? {}
  const nextSettings: Record<string, unknown> = { ...currentSettings, ai_runtime: parsed.data }
  const { error } = await admin
    .from('organisations')
    .update({ settings: nextSettings as Json })
    .eq('id', orgId)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ success: true, data: parsed.data })
}


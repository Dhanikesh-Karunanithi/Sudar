import { createClient, createAdminClient } from '@/lib/supabase/server'
import { requireOrgAdmin } from '@/lib/org'
import { NextResponse } from 'next/server'
import { performanceConfigSchema } from '@/types/performance'
import type { Json } from '@/types/database'

/**
 * GET /api/org/settings — Return current org settings (performance_config, etc.). Admin/Manager only.
 */
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

  const admin = createAdminClient()
  const { data: org } = await admin
    .from('organisations')
    .select('settings')
    .eq('id', orgId)
    .single()

  const settings = (org?.settings as Record<string, unknown>) ?? {}
  const performance_config = settings.performance_config ?? null
  const ai_models = (settings.ai_models as Record<string, string | null> | undefined) ?? {}
  const sso_config = (settings.sso_config as Record<string, unknown> | undefined) ?? null

  return NextResponse.json({
    performance_config,
    institution_type: (performance_config as Record<string, unknown>)?.institution_type ?? null,
    kpis: (performance_config as Record<string, unknown>)?.kpis ?? [],
    scale: (performance_config as Record<string, unknown>)?.scale ?? null,
    terms: (performance_config as Record<string, unknown>)?.terms ?? [],
    ai_models: {
      tts_voice: ai_models.tts_voice ?? null,
      content_generation_model: ai_models.content_generation_model ?? null,
      tutor_model: ai_models.tutor_model ?? null,
    },
    sso_config,
  })
}

/**
 * PATCH /api/org/settings — Update org performance_config. Admin/Manager only.
 */
export async function PATCH(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let orgId: string
  try {
    orgId = await requireOrgAdmin(user.id)
  } catch {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await request.json()
  const admin = createAdminClient()
  const { data: org } = await admin
    .from('organisations')
    .select('settings')
    .eq('id', orgId)
    .single()

  const currentSettings = (org?.settings as Record<string, unknown>) ?? {}
  const updatedSettings: Record<string, unknown> = { ...currentSettings }

  if (body.performance_config !== undefined) {
    const parsed = performanceConfigSchema.safeParse(body.performance_config)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid performance_config', details: parsed.error.flatten() }, { status: 400 })
    }
    updatedSettings.performance_config = parsed.data
  }

  if (body.ai_models !== undefined && typeof body.ai_models === 'object') {
    const ai = body.ai_models as Record<string, string | null>
    updatedSettings.ai_models = {
      ...(typeof currentSettings.ai_models === 'object' && currentSettings.ai_models !== null
        ? (currentSettings.ai_models as Record<string, unknown>)
        : {}),
      ...(ai.tts_voice !== undefined && { tts_voice: ai.tts_voice }),
      ...(ai.content_generation_model !== undefined && { content_generation_model: ai.content_generation_model }),
      ...(ai.tutor_model !== undefined && { tutor_model: ai.tutor_model }),
    }
  }

  if (body.sso_config !== undefined) {
    const raw = body.sso_config
    if (raw === null || (typeof raw === 'object' && !Array.isArray(raw))) {
      updatedSettings.sso_config = raw as Record<string, unknown> | null
    }
  }

  const { error } = await admin
    .from('organisations')
    .update({ settings: updatedSettings as Json })
    .eq('id', orgId)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true, settings: updatedSettings })
}

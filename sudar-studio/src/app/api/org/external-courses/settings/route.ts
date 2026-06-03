import { createServiceRoleSupabaseClient } from '@/lib/supabase/server'
import { getRequestSession } from '@/lib/auth/requestSession'
import { requireOrgAdmin, getOrCreateOrg } from '@/lib/org'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import type { OrgExternalCoursePolicy } from '../../../../../../../shared/external-courses/types'
import type { Json } from '@/types/database'

const providerSchema = z.object({
  provider_slug: z.string().min(1),
  api_key: z.string().optional().nullable(),
  api_secret: z.string().optional().nullable(),
  sync_enabled: z.boolean().optional(),
  auto_tag_enabled: z.boolean().optional(),
  tag_mapping: z.record(z.string(), z.string()).optional(),
})

const patchSchema = z.object({
  policy: z
    .object({
      allow_external_courses: z.boolean().optional(),
      require_learner_consent: z.boolean().optional(),
      default_content_access_mode: z.enum(['iframe_only', 'tutor_access', 'both']).optional(),
      default_allow_tutor_discussion: z.boolean().optional(),
      enabled_providers: z.array(z.string()).optional(),
    })
    .optional(),
  providers: z.array(providerSchema).optional(),
})

export async function GET(request: NextRequest) {
  const session = await getRequestSession(request)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let orgId: string
  try {
    orgId = await requireOrgAdmin(session.user.id)
  } catch {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const admin = createServiceRoleSupabaseClient()
  const { data: org } = await admin.from('organisations').select('settings').eq('id', orgId).single()
  const settings = (org?.settings as Record<string, unknown>) ?? {}
  const policy = (settings.external_courses as OrgExternalCoursePolicy) ?? {
    allow_external_courses: true,
    require_learner_consent: false,
    default_content_access_mode: 'both',
    default_allow_tutor_discussion: true,
    enabled_providers: ['youtube', 'khan', 'udemy', 'coursera', 'edx', 'manual'],
  }

  const { data: providers } = await admin
    .from('external_course_providers' as 'courses')
    .select('id, provider_slug, sync_enabled, auto_tag_enabled, tag_mapping, api_key, api_secret')
    .eq('org_id', orgId)

  type ProviderRow = {
    id: string
    provider_slug: string
    sync_enabled: boolean
    auto_tag_enabled: boolean
    tag_mapping: unknown
    api_key: string | null
    api_secret: string | null
  }

  const masked = ((providers ?? []) as ProviderRow[]).map((p) => ({
    ...p,
    api_key: p.api_key ? '••••' + String(p.api_key).slice(-4) : null,
    api_secret: p.api_secret ? '••••' : null,
  }))

  return NextResponse.json({ policy, providers: masked })
}

export async function PATCH(request: NextRequest) {
  const session = await getRequestSession(request)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let orgId: string
  try {
    orgId = await requireOrgAdmin(session.user.id)
  } catch {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const parsed = patchSchema.safeParse(await request.json().catch(() => ({})))
  if (!parsed.success) return NextResponse.json({ error: 'Invalid body' }, { status: 400 })

  const admin = createServiceRoleSupabaseClient()
  const now = new Date().toISOString()

  if (parsed.data.policy) {
    const { data: org } = await admin.from('organisations').select('settings').eq('id', orgId).single()
    const settings = { ...((org?.settings as Record<string, unknown>) ?? {}) }
    settings.external_courses = {
      ...((settings.external_courses as OrgExternalCoursePolicy) ?? {}),
      ...parsed.data.policy,
    }
    await admin.from('organisations').update({ settings: settings as Json }).eq('id', orgId)
  }

  if (parsed.data.providers) {
    for (const p of parsed.data.providers) {
      const row: Record<string, unknown> = {
        org_id: orgId,
        provider_slug: p.provider_slug,
        sync_enabled: p.sync_enabled ?? false,
        auto_tag_enabled: p.auto_tag_enabled ?? true,
        tag_mapping: p.tag_mapping ?? {},
        updated_at: now,
      }
      if (p.api_key && !p.api_key.startsWith('••••')) row.api_key = p.api_key
      if (p.api_secret && p.api_secret !== '••••') row.api_secret = p.api_secret

      await admin.from('external_course_providers' as 'courses').upsert(row as never, {
        onConflict: 'org_id,provider_slug',
      })
    }
  }

  return NextResponse.json({ ok: true })
}

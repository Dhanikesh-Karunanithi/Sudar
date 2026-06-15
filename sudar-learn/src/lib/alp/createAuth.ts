/**
 * Auth helper for Sudar Create (/api/alp/create/*) routes.
 * Requires org-scoped ALP key or create embed token.
 */
import { NextResponse } from 'next/server'
import {
  getAlpKeyFromRequest,
  rejectAlpUserOutsideOrg,
  validateAlpKey,
  validateEmbedToken,
} from '@/lib/alp-auth'
import { createServiceRoleSupabaseClient } from '@/lib/supabase/server'
import { buildPrivateOpenAiRuntime } from '@/types/orgAiInference'
import type { ChatCompletionContext } from '@/lib/ai/chat'
import { buildLearnUsageChatCtx } from '@/lib/ai/learnUsageContext'
import type { Database } from '@/types/database'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { AiUsageFeature } from '../../../../shared/ai/usageTypes'

export type CreateAuthContext = {
  orgId: string
  creatorUserId: string
  admin: SupabaseClient<Database>
  orgSettings: unknown
  privateRuntime: ReturnType<typeof buildPrivateOpenAiRuntime>
}

type CreateEmbedPayload = {
  sub: string
  org_id?: string | null
  scope?: string | null
  tool?: string | null
}

export function validateCreateEmbedToken(token: string | null): CreateEmbedPayload | null {
  if (!token?.includes('.')) return null
  const base = validateEmbedToken(token)
  if (!base) return null
  try {
    const [b64] = token.split('.')
    const payload = JSON.parse(Buffer.from(b64, 'base64url').toString('utf8')) as CreateEmbedPayload
    if (payload.scope !== 'create') return null
    if (!payload.org_id) return null
    return { ...base, org_id: payload.org_id, scope: payload.scope, tool: payload.tool ?? null }
  } catch {
    return null
  }
}

export async function resolveCreateAuth(
  request: Request,
  creatorUserIdFromBody?: string,
): Promise<{ ok: true; ctx: CreateAuthContext } | { ok: false; response: NextResponse }> {
  const keyOrToken = getAlpKeyFromRequest(request)
  const admin = createServiceRoleSupabaseClient()

  const embedPayload = keyOrToken?.includes('.') ? validateCreateEmbedToken(keyOrToken) : null
  if (embedPayload?.org_id) {
    const creatorUserId = creatorUserIdFromBody ?? embedPayload.sub
    const orgError = await rejectAlpUserOutsideOrg(admin, { valid: true, orgId: embedPayload.org_id }, creatorUserId)
    if (orgError) return { ok: false, response: orgError }
    const ctx = await loadCreateContext(admin, embedPayload.org_id, creatorUserId)
    if (!ctx) return { ok: false, response: NextResponse.json({ error: 'Organisation not found' }, { status: 404 }) }
    return { ok: true, ctx }
  }

  const auth = await validateAlpKey(keyOrToken)
  if (!auth.valid || !auth.orgId) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: 'Unauthorized — org-scoped ALP API key required for Sudar Create' },
        { status: auth.valid ? 403 : 401 },
      ),
    }
  }

  const creatorUserId = creatorUserIdFromBody
  if (!creatorUserId) {
    const fallback = await resolveOrgCreatorFallback(admin, auth.orgId)
    if (!fallback) {
      return {
        ok: false,
        response: NextResponse.json({ error: 'creator_user_id required' }, { status: 400 }),
      }
    }
    const ctx = await loadCreateContext(admin, auth.orgId, fallback)
    if (!ctx) return { ok: false, response: NextResponse.json({ error: 'Organisation not found' }, { status: 404 }) }
    return { ok: true, ctx }
  }

  const orgError = await rejectAlpUserOutsideOrg(admin, auth, creatorUserId)
  if (orgError) return { ok: false, response: orgError }

  const ctx = await loadCreateContext(admin, auth.orgId, creatorUserId)
  if (!ctx) return { ok: false, response: NextResponse.json({ error: 'Organisation not found' }, { status: 404 }) }
  return { ok: true, ctx }
}

async function resolveOrgCreatorFallback(
  admin: SupabaseClient<Database>,
  orgId: string,
): Promise<string | null> {
  const { data } = await admin
    .from('org_members')
    .select('user_id, role')
    .eq('org_id', orgId)
    .in('role', ['ADMIN', 'MANAGER', 'CREATOR'])
    .limit(1)
    .maybeSingle()
  return data?.user_id ?? null
}

async function loadCreateContext(
  admin: SupabaseClient<Database>,
  orgId: string,
  creatorUserId: string,
): Promise<CreateAuthContext | null> {
  const { data: org } = await admin.from('organisations').select('settings').eq('id', orgId).maybeSingle()
  if (!org) return null
  const settings = org.settings ?? {}
  return {
    orgId,
    creatorUserId,
    admin,
    orgSettings: settings,
    privateRuntime: buildPrivateOpenAiRuntime(settings),
  }
}

export function createMeteringCtx(
  ctx: CreateAuthContext,
  feature: AiUsageFeature,
  route: string,
): ChatCompletionContext {
  return buildLearnUsageChatCtx({
    admin: ctx.admin as unknown as NonNullable<ChatCompletionContext['usageAdmin']>,
    orgId: ctx.orgId,
    userId: ctx.creatorUserId,
    feature,
    route,
    privateRuntime: ctx.privateRuntime,
    orgSettings: ctx.orgSettings,
  })
}

export function scormBase64(buf: Buffer): string {
  return buf.toString('base64')
}

/**
 * HttpOnly cookie so iframe loads to /api/studio/ai/generate-video/render/... include auth
 * (nested navigations often omit Supabase session cookies).
 */
import { createClient, createServiceRoleSupabaseClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { rejectCrossSiteRequest } from '@/lib/security/sameOrigin'
import {
  canStudioUserAccessSudarVidJob,
  mintStudioSudarVidRenderGrant,
  STUDIO_SUDARVID_JOB_ID_RE,
  STUDIO_SUDAR_VID_RENDER_COOKIE,
} from '@/lib/security/studioSudarVidRenderAccess'

export async function POST(request: NextRequest) {
  const originError = rejectCrossSiteRequest(request)
  if (originError) return originError

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized', code: 'UNAUTHORIZED' }, { status: 401 })

  const body = await request.json().catch(() => ({}))
  const jobId = typeof body.job_id === 'string' ? body.job_id.trim() : ''
  if (!jobId || !STUDIO_SUDARVID_JOB_ID_RE.test(jobId)) {
    return NextResponse.json({ error: 'job_id required' }, { status: 400 })
  }

  const admin = createServiceRoleSupabaseClient()
  const allowed = await canStudioUserAccessSudarVidJob(admin, user.id, jobId)
  if (!allowed) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const token = mintStudioSudarVidRenderGrant(user.id, jobId)
  if (!token) {
    return NextResponse.json(
      { error: 'render_grant_not_configured', detail: 'Set SUDARVID_RENDER_GRANT_SECRET or SUPABASE_SERVICE_ROLE_KEY' },
      { status: 500 },
    )
  }

  const res = NextResponse.json({ ok: true })
  res.cookies.set(STUDIO_SUDAR_VID_RENDER_COOKIE.name, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: STUDIO_SUDAR_VID_RENDER_COOKIE.path,
    maxAge: STUDIO_SUDAR_VID_RENDER_COOKIE.maxAge,
  })
  return res
}

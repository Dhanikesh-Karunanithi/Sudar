/**
 * Sets an HttpOnly cookie so same-origin iframe navigations to /api/ai/generate-video/render/.../slides.html
 * (and relative assets) include auth: those requests often do not carry Supabase session cookies reliably.
 */
import { createClient, createServiceRoleSupabaseClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { canUserAccessSudarVidJob, isSafeSudarVidJobId } from '@/lib/security/sudarVidAccess'
import { mintSudarVidRenderGrant, SUDAR_VID_RENDER_COOKIE } from '@/lib/security/sudarVidRenderGrant'

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized', code: 'UNAUTHORIZED' }, { status: 401 })

  const body = await request.json().catch(() => ({}))
  const jobId = typeof body.job_id === 'string' ? body.job_id.trim() : ''
  if (!jobId || !isSafeSudarVidJobId(jobId)) {
    return NextResponse.json({ error: 'job_id required' }, { status: 400 })
  }

  const admin = createServiceRoleSupabaseClient()
  const allowed = await canUserAccessSudarVidJob(admin, user.id, jobId)
  if (!allowed) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const token = mintSudarVidRenderGrant(user.id, jobId)
  if (!token) {
    return NextResponse.json(
      { error: 'render_grant_not_configured', detail: 'Set SUDARVID_RENDER_GRANT_SECRET or SUPABASE_SERVICE_ROLE_KEY' },
      { status: 500 },
    )
  }

  const res = NextResponse.json({ ok: true })
  res.cookies.set(SUDAR_VID_RENDER_COOKIE.name, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: SUDAR_VID_RENDER_COOKIE.path,
    maxAge: SUDAR_VID_RENDER_COOKIE.maxAge,
  })
  return res
}

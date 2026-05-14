import { createServiceRoleSupabaseClient, createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { rejectCrossSiteRequest } from '@/lib/security/sameOrigin'
import {
  canStudioUserAccessSudarVidJob,
  normalizeStudioRenderAssetPath,
  STUDIO_SUDAR_VID_RENDER_COOKIE,
  verifyStudioSudarVidRenderGrant,
} from '@/lib/security/studioSudarVidRenderAccess'

const SUDARVID_URL = process.env.SUDARVID_URL ?? 'http://localhost:8000'

export async function GET(request: NextRequest, { params }: { params: Promise<{ jobId: string; path: string[] }> }) {
  const originError = rejectCrossSiteRequest(request)
  if (originError) return originError

  const { jobId, path } = await params
  let userId: string | null = null
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (user) userId = user.id
  else {
    const raw = request.cookies.get(STUDIO_SUDAR_VID_RENDER_COOKIE.name)?.value
    const grant = verifyStudioSudarVidRenderGrant(raw, jobId)
    if (grant) userId = grant.u
  }
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized', code: 'UNAUTHORIZED' }, { status: 401 })
  }

  const admin = createServiceRoleSupabaseClient()
  const allowed = await canStudioUserAccessSudarVidJob(admin, userId, jobId)
  if (!allowed) return new NextResponse('Forbidden', { status: 403 })

  const filePath = normalizeStudioRenderAssetPath(path)
  if (!filePath) return new NextResponse('Not found', { status: 404 })

  try {
    const res = await fetch(`${SUDARVID_URL.replace(/\/$/, '')}/render/${jobId}/${filePath}`)
    if (!res.ok) {
      return new NextResponse(await res.text(), { status: res.status })
    }

    const contentType = res.headers.get('content-type') ?? 'application/octet-stream'
    const buffer = await res.arrayBuffer()
    const contentTypeLower = contentType.toLowerCase()
    const isDocument = contentTypeLower.includes('text/html') || contentTypeLower.includes('application/json')
    const cacheControl = isDocument ? 'private, no-store' : 'private, max-age=3600'

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': cacheControl,
      },
    })
  } catch (err) {
    return new NextResponse(
      err instanceof Error ? err.message : 'Failed to fetch asset',
      { status: 502 },
    )
  }
}

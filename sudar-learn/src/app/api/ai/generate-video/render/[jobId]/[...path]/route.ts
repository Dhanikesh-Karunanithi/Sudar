/**
 * Proxy for SudarVid job output files (slides.html, audio, images, static assets).
 * The generated slides.html uses relative URLs for all its assets, so every sub-path
 * of the job folder must resolve through this route when served inside an iframe.
 *
 * Auth: normal Supabase session **or** HttpOnly `sudar_vid_render` cookie minted by
 * POST /api/ai/generate-video/render-grant (iframe navigations often omit session cookies).
 */
import { createServiceRoleSupabaseClient, createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { getSudarVidBaseUrl } from '@/lib/sudarvid'
import { canUserAccessSudarVidJob, normalizeRenderAssetPath } from '@/lib/security/sudarVidAccess'
import { SUDAR_VID_RENDER_COOKIE, verifySudarVidRenderGrant } from '@/lib/security/sudarVidRenderGrant'

const SUDARVID_URL = getSudarVidBaseUrl()

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ jobId: string; path: string[] }> }
) {
  const { jobId, path } = await params
  let userId: string | null = null
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (user) userId = user.id
  else {
    const raw = request.cookies.get(SUDAR_VID_RENDER_COOKIE.name)?.value
    const grant = verifySudarVidRenderGrant(raw, jobId)
    if (grant) userId = grant.u
  }
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized', code: 'UNAUTHORIZED' }, { status: 401 })
  }

  const admin = createServiceRoleSupabaseClient()
  const allowed = await canUserAccessSudarVidJob(admin, userId, jobId)
  if (!allowed) return new NextResponse('Forbidden', { status: 403 })

  const filePath = normalizeRenderAssetPath(path)
  if (!filePath) return new NextResponse('Not found', { status: 404 })

  const url = `${SUDARVID_URL}/render/${jobId}/${filePath}`

  try {
    const res = await fetch(url)
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
      { status: 502 }
    )
  }
}

/**
 * Proxy for SudarVid job output files (slides.html, audio, images, static assets).
 * The generated slides.html uses relative URLs for all its assets, so every sub-path
 * of the job folder must resolve through this route when served inside an iframe.
 */
import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { getSudarVidBaseUrl } from '@/lib/sudarvid'

const SUDARVID_URL = getSudarVidBaseUrl()

export async function GET(
  _request: NextRequest,
  { params }: { params: { jobId: string; path: string[] } }
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return new NextResponse('Unauthorized', { status: 401 })

  const filePath = params.path.join('/')
  const url = `${SUDARVID_URL}/render/${params.jobId}/${filePath}`

  try {
    const res = await fetch(url)
    if (!res.ok) {
      return new NextResponse(await res.text(), { status: res.status })
    }

    const contentType = res.headers.get('content-type') ?? 'application/octet-stream'
    const buffer = await res.arrayBuffer()

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=3600',
      },
    })
  } catch (err) {
    return new NextResponse(
      err instanceof Error ? err.message : 'Failed to fetch asset',
      { status: 502 }
    )
  }
}

/**
 * SCORM file proxy — serves SCORM package assets from Supabase Storage
 * with correct Content-Type headers so the browser renders HTML/CSS/JS
 * instead of treating them as plain text or downloads.
 *
 * The iframe src is always same-origin (/api/scorm/…), so:
 *  - The browser renders HTML as HTML (not plain text)
 *  - Relative URLs inside the SCORM HTML resolve through this same route
 *  - The SCORM API shim's postMessage reaches the parent without CORS issues
 */

import { createAdminClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

const MIME: Record<string, string> = {
  html:  'text/html; charset=utf-8',
  htm:   'text/html; charset=utf-8',
  js:    'application/javascript; charset=utf-8',
  mjs:   'application/javascript; charset=utf-8',
  css:   'text/css; charset=utf-8',
  json:  'application/json; charset=utf-8',
  xml:   'application/xml; charset=utf-8',
  txt:   'text/plain; charset=utf-8',
  png:   'image/png',
  jpg:   'image/jpeg',
  jpeg:  'image/jpeg',
  gif:   'image/gif',
  svg:   'image/svg+xml',
  webp:  'image/webp',
  ico:   'image/x-icon',
  mp4:   'video/mp4',
  webm:  'video/webm',
  mp3:   'audio/mpeg',
  ogg:   'audio/ogg',
  wav:   'audio/wav',
  woff:  'font/woff',
  woff2: 'font/woff2',
  ttf:   'font/ttf',
  swf:   'application/x-shockwave-flash',
  zip:   'application/zip',
}

export async function GET(
  _request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  const storagePath = params.path.join('/')

  const admin = createAdminClient()
  const { data, error } = await admin.storage
    .from('course-media')
    .download(storagePath)

  if (error || !data) {
    return new NextResponse('Not found', { status: 404 })
  }

  const ext = storagePath.split('.').pop()?.toLowerCase() ?? ''
  const contentType = MIME[ext] ?? 'application/octet-stream'

  return new NextResponse(await data.arrayBuffer(), {
    headers: {
      'Content-Type': contentType,
      'Cache-Control': 'public, max-age=3600',
      // Allow rendering inside iframes on the same origin
      'X-Frame-Options': 'SAMEORIGIN',
    },
  })
}

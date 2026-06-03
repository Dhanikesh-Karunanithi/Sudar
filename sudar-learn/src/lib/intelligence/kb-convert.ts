/**
 * Call Sudar Intelligence MarkItDown conversion for knowledge-base ingest.
 */
import { sudarIntelligenceBaseUrl } from '@/lib/intelligence/baseUrl'

export interface KbConvertResult {
  markdown: string
  pages?: number | null
  images_extracted?: number | null
  ocr_used?: boolean
  title?: string | null
}

const INTELLIGENCE_SERVICE_SECRET = process.env.INTELLIGENCE_SERVICE_SECRET?.trim()

export async function convertFileToMarkdown(
  buffer: Buffer,
  filename: string,
  mimeType: string,
): Promise<KbConvertResult> {
  const base = sudarIntelligenceBaseUrl()
  if (!base) {
    throw new Error('SUDAR_INTELLIGENCE_URL is not configured')
  }

  const form = new FormData()
  const blob = new Blob([new Uint8Array(buffer)], { type: mimeType })
  form.append('file', blob, filename)

  const headers: Record<string, string> = {}
  if (INTELLIGENCE_SERVICE_SECRET) {
    headers['X-Intelligence-Service-Secret'] = INTELLIGENCE_SERVICE_SECRET
  }

  const res = await fetch(`${base}/api/kb/convert-markdown`, {
    method: 'POST',
    headers,
    body: form,
  })

  const text = await res.text()
  if (!res.ok) {
    let detail = text
    try {
      const j = JSON.parse(text) as { detail?: string }
      detail = j.detail ?? text
    } catch {
      /* use raw */
    }
    throw new Error(detail || `MarkItDown failed (${res.status})`)
  }

  const data = JSON.parse(text) as KbConvertResult
  if (!data.markdown?.trim()) {
    throw new Error('MarkItDown returned empty markdown')
  }
  return data
}

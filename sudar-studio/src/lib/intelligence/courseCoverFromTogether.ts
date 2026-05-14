/**
 * Optional AI course cover via Sudar Intelligence / Together (FLUX), uploaded to course-media.
 */
import type { SupabaseClient } from '@supabase/supabase-js'
import { isAppLocale } from '../../../../shared/i18nLocales'
import type { Database } from '@/types/database'

const INTELLIGENCE_URL = (process.env.SUDAR_INTELLIGENCE_URL ?? process.env.BYTEOS_INTELLIGENCE_URL)?.replace(
  /\/$/,
  '',
)
const INTELLIGENCE_SERVICE_SECRET = process.env.INTELLIGENCE_SERVICE_SECRET?.trim()

type Admin = SupabaseClient<Database>

export async function getOrgDefaultUiLocale(admin: Admin, orgId: string): Promise<string | null> {
  const { data: orgRow } = await admin.from('organisations').select('settings').eq('id', orgId).maybeSingle()
  const settingsRaw = (orgRow?.settings as Record<string, unknown> | undefined) ?? {}
  const locRaw = settingsRaw.localization as Record<string, unknown> | undefined
  const v = locRaw?.default_ui_locale
  return typeof v === 'string' && isAppLocale(v) ? v : null
}

export async function suggestCourseCoverImagesFromIntelligence(
  admin: Admin,
  orgId: string,
  courseTitle: string,
  tagLabels: string[],
  /** Org default UI / culture hint for illustration brief (BCP-47). */
  orgUiLanguage: string | null | undefined,
): Promise<{ thumbnail_url: string | null; banner_url: string | null }> {
  if (!INTELLIGENCE_URL) {
    return { thumbnail_url: null, banner_url: null }
  }

  const language =
    typeof orgUiLanguage === 'string' && isAppLocale(orgUiLanguage) ? orgUiLanguage : null
  const tagLine = tagLabels.slice(0, 8).join(', ')
  const prompt = [
    'Flat vector hero illustration for a corporate learning course catalog tile.',
    'No text, no logos, no watermarks. Clean gradient background, professional tones.',
    `Course theme (abstract): ${courseTitle.trim().slice(0, 120)}.`,
    tagLine ? `Visual motifs related to: ${tagLine}.` : '',
  ]
    .filter(Boolean)
    .join(' ')

  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  if (INTELLIGENCE_SERVICE_SECRET) {
    headers['X-Intelligence-Service-Secret'] = INTELLIGENCE_SERVICE_SECRET
  }

  let res: Response
  try {
    res = await fetch(`${INTELLIGENCE_URL}/api/image/generate`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        prompt: prompt.slice(0, 2000),
        language: language ?? undefined,
        culture_context: tagLine ? `Organization catalog, audience-neutral imagery. Tags: ${tagLine}.` : undefined,
        style: 'modern flat illustration, high contrast, suitable as 16:9 thumbnail',
      }),
    })
  } catch {
    return { thumbnail_url: null, banner_url: null }
  }

  const rawText = await res.text()
  if (!res.ok) {
    return { thumbnail_url: null, banner_url: null }
  }

  let data: { b64_json?: string | null; url?: string | null }
  try {
    data = JSON.parse(rawText) as { b64_json?: string | null; url?: string | null }
  } catch {
    return { thumbnail_url: null, banner_url: null }
  }

  let publicUrl: string | null = typeof data.url === 'string' && data.url.startsWith('http') ? data.url : null

  if (!publicUrl && data.b64_json?.trim()) {
    const buf = Buffer.from(data.b64_json.trim(), 'base64')
    const { fileTypeFromBuffer } = await import('file-type')
    const detected = await fileTypeFromBuffer(buf)
    const mime = detected?.mime?.toLowerCase() ?? 'image/png'
    const ext = mime === 'image/webp' ? 'webp' : mime === 'image/jpeg' || mime === 'image/jpg' ? 'jpg' : 'png'
    const name = `${crypto.randomUUID()}.${ext}`
    const objectPath = `${orgId}/ai-covers/${name}`

    const { data: up, error } = await admin.storage.from('course-media').upload(objectPath, buf, {
      contentType: mime,
      upsert: false,
    })
    if (error || !up) {
      return { thumbnail_url: null, banner_url: null }
    }
    const { data: urlData } = admin.storage.from('course-media').getPublicUrl(up.path)
    publicUrl = urlData.publicUrl
  }

  if (!publicUrl) {
    return { thumbnail_url: null, banner_url: null }
  }

  return { thumbnail_url: publicUrl, banner_url: publicUrl }
}

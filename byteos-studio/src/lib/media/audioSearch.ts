/**
 * Freesound API v2 search for audio in the block editor.
 * Get API key from https://freesound.org/apiv2/apply/ (free).
 */

export interface FreesoundResult {
  id: number
  name: string
  url: string
  duration: number
  attribution: string
  license?: string
}

const BASE = 'https://freesound.org/apiv2'

export async function searchAudioFreesound(
  query: string,
  count: number = 12,
  apiKey: string
): Promise<FreesoundResult[]> {
  if (!apiKey?.trim()) return []
  const params = new URLSearchParams({
    token: apiKey,
    query: query.trim(),
    fields: 'id,name,previews,duration,license,username',
    page_size: String(Math.min(150, Math.max(1, count))),
    filter: 'license:"Creative Commons 0"',
  })
  const url = `${BASE}/search/?${params.toString()}`
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Freesound API error: ${res.status}`)
  const data = await res.json()
  const results = (data.results ?? []) as Array<{
    id: number
    name?: string
    previews?: { 'preview-hq-mp3'?: string }
    duration?: number
    license?: string
    username?: string
  }>
  return results
    .filter((r) => r.previews?.['preview-hq-mp3'])
    .map((r) => ({
      id: r.id,
      name: r.name ?? `Sound ${r.id}`,
      url: r.previews!['preview-hq-mp3']!,
      duration: r.duration ?? 0,
      attribution: r.username ? `by ${r.username} (Freesound.org)` : 'Freesound.org',
      license: r.license,
    }))
}

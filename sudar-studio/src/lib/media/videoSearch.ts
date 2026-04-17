/**
 * Optional YouTube URL discovery via Google Programmable Search (same keys as image search).
 * Returns watch URLs only when the API is configured and a result is found.
 */

const YOUTUBE_WATCH = /^https?:\/\/(www\.)?youtube\.com\/watch\?v=([a-zA-Z0-9_-]{11})/i
const YOUTUBE_SHORT = /^https?:\/\/youtu\.be\/([a-zA-Z0-9_-]{11})/i

export function extractYouTubeVideoId(url: string): string | null {
  const w = YOUTUBE_WATCH.exec(url)
  if (w?.[2]) return w[2]
  const s = YOUTUBE_SHORT.exec(url)
  if (s?.[1]) return s[1]
  return null
}

/** Famous placeholder / meme IDs models often hallucinate — block from embeds. */
export const BLOCKLISTED_YOUTUBE_IDS = new Set(['dQw4w9WgXcQ'])

export function isBlocklistedYouTubeUrl(url: string): boolean {
  const id = extractYouTubeVideoId(url)
  return id != null && BLOCKLISTED_YOUTUBE_IDS.has(id)
}

/** True if URL is missing, blocklisted, or not a recognizable YouTube watch URL. */
export function isUnverifiedOrBadVideoUrl(url: unknown): boolean {
  if (typeof url !== 'string' || !url.trim()) return true
  const id = extractYouTubeVideoId(url.trim())
  if (!id) return true
  return BLOCKLISTED_YOUTUBE_IDS.has(id)
}

/**
 * Search for an educational video; prefers results on youtube.com.
 */
export interface VideoSearchResultPexels {
  url: string
  thumbnailUrl?: string
  title?: string
  attribution?: string
}

/** Pexels stock videos for the media picker (ModuleBlockEditor). */
export async function searchVideosPexels(query: string, count: number): Promise<VideoSearchResultPexels[]> {
  const apiKey = process.env.PEXELS_API_KEY
  if (!apiKey) return []
  const perPage = Math.min(Math.max(1, count), 15)
  const res = await fetch(
    `https://api.pexels.com/videos/search?query=${encodeURIComponent(query.trim())}&per_page=${perPage}`,
    { headers: { Authorization: apiKey } }
  )
  if (!res.ok) return []
  const data = (await res.json()) as {
    videos?: Array<{
      image?: string
      video_files?: Array<{ link?: string; quality?: string }>
      video_pictures?: Array<{ picture?: string }>
      user?: { name?: string }
    }>
  }
  const out: VideoSearchResultPexels[] = []
  for (const v of data.videos ?? []) {
    const files = v.video_files ?? []
    const best = files.find((f) => f.quality === 'hd') ?? files[0]
    const url = best?.link
    if (!url) continue
    out.push({
      url,
      thumbnailUrl: v.image ?? v.video_pictures?.[0]?.picture,
      attribution: v.user?.name ? `Video by ${v.user.name} on Pexels` : undefined,
    })
  }
  return out
}

export async function searchYouTubeWatchUrl(
  query: string,
  maxResults = 3
): Promise<{ url: string; title: string } | null> {
  const apiKey = process.env.GOOGLE_SEARCH_API_KEY
  const cx = process.env.GOOGLE_SEARCH_ENGINE_ID
  if (!apiKey || !cx) return null

  const q = `${query.trim()} tutorial OR explained site:youtube.com`.slice(0, 200)
  const num = Math.min(Math.max(1, maxResults), 10)
  const url = `https://www.googleapis.com/customsearch/v1?key=${encodeURIComponent(apiKey)}&cx=${encodeURIComponent(cx)}&q=${encodeURIComponent(q)}&num=${num}`

  try {
    const res = await fetch(url)
    if (!res.ok) return null
    const data = (await res.json()) as { items?: { link?: string; title?: string }[] }
    for (const item of data.items ?? []) {
      const link = item.link
      if (!link) continue
      const id = extractYouTubeVideoId(link)
      if (!id || BLOCKLISTED_YOUTUBE_IDS.has(id)) continue
      if (link.includes('youtube.com') || link.includes('youtu.be')) {
        const watch = link.includes('youtu.be/')
          ? `https://www.youtube.com/watch?v=${id}`
          : link.split('&')[0]
        return { url: watch, title: item.title ?? query }
      }
    }
    return null
  } catch {
    return null
  }
}

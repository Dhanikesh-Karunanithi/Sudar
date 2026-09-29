/**
 * Verified YouTube discovery for Learn tutor (Journey notebook).
 * Same CSE keys as Studio — never invent video ids.
 */

const YOUTUBE_WATCH = /^https?:\/\/(www\.)?youtube\.com\/watch\?v=([a-zA-Z0-9_-]{11})/i
const YOUTUBE_SHORT = /^https?:\/\/youtu\.be\/([a-zA-Z0-9_-]{11})/i

const BLOCKLISTED_YOUTUBE_IDS = new Set(['dQw4w9WgXcQ'])

export function extractYouTubeVideoId(url: string): string | null {
  const w = YOUTUBE_WATCH.exec(url)
  if (w?.[2]) return w[2]
  const s = YOUTUBE_SHORT.exec(url)
  if (s?.[1]) return s[1]
  return null
}

/**
 * Search for an educational YouTube video via Google Programmable Search.
 * Returns null when keys are unset or no allowlisted result is found.
 */
export async function searchYouTubeWatchUrlForTutor(
  query: string,
  maxResults = 3,
): Promise<{ url: string; title: string } | null> {
  const apiKey = process.env.GOOGLE_SEARCH_API_KEY
  const cx = process.env.GOOGLE_SEARCH_ENGINE_ID
  if (!apiKey || !cx) return null

  const q = `${query.trim()} tutorial OR explained OR beginners site:youtube.com`.slice(0, 200)
  if (q.length < 8) return null
  const num = Math.min(Math.max(1, maxResults), 8)
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

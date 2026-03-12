/**
 * ByteOS Studio — Video search for embedding (Pexels).
 * Unsplash does not provide a public video API.
 */

export interface VideoResult {
  url: string
  thumbnailUrl?: string
  title?: string
  attribution?: string
  width?: number
  height?: number
}

const MAX_QUERY_LEN = 100
const DEFAULT_PER_PAGE = 12
const MAX_PER_PAGE = 15

/**
 * Search Pexels for videos. Returns direct video file URLs suitable for <video> or embed.
 * Uses the same PEXELS_API_KEY as image search.
 */
export async function searchVideosPexels(
  query: string,
  count: number = DEFAULT_PER_PAGE
): Promise<VideoResult[]> {
  const apiKey = process.env.PEXELS_API_KEY
  if (!apiKey) return []

  const q = query.trim().slice(0, MAX_QUERY_LEN) || 'nature'
  const perPage = Math.min(Math.max(1, count), MAX_PER_PAGE)

  try {
    const res = await fetch(
      `https://api.pexels.com/v1/videos/search?query=${encodeURIComponent(q)}&per_page=${perPage}`,
      { headers: { Authorization: apiKey } }
    )
    if (!res.ok) return []
    const data = await res.json()
    const results: VideoResult[] = []
    for (const video of data.videos ?? []) {
      const videoFiles = video.video_files ?? []
      const best = videoFiles.find((f: { quality?: string }) => f.quality === 'hd') ||
        videoFiles.find((f: { quality?: string }) => f.quality === 'sd') ||
        videoFiles[0]
      if (!best?.link) continue
      const thumb = video.image ?? video.video_pictures?.[0]?.picture
      results.push({
        url: best.link,
        thumbnailUrl: typeof thumb === 'string' ? thumb : undefined,
        title: video.user?.name ? `Video by ${video.user.name} on Pexels` : undefined,
        attribution: video.user?.name ? `Video by ${video.user.name} on Pexels` : undefined,
        width: best.width,
        height: best.height,
      })
    }
    return results
  } catch {
    return []
  }
}

/**
 * Sudar Studio — Multi-source image search with Google-first fallback.
 * Used by AI generation routes and the media search API.
 */

export interface ImageResult {
  url: string
  thumbnailUrl?: string
  alt?: string
  attribution?: string
}

export interface SearchImagesOptions {
  /** Max number of images to return (default 1 for generation, 15 for UI). */
  count?: number
  /** If set, try this source first, then fall back to others. */
  preferredSource?: 'google' | 'pexels' | 'unsplash'
}

const MAX_QUERY_LEN = 100
const STOP_WORDS = new Set([
  'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with',
  'by', 'from', 'as', 'is', 'was', 'are', 'were', 'been', 'be', 'have', 'has', 'had',
  'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'must',
  'this', 'that', 'these', 'those', 'it', 'its', 'into', 'through', 'during',
  'introduction', 'overview', 'summary', 'concepts', 'basics', 'advanced',
])

/** Derive a tighter image keyword query from module/course context. */
export function refineImageQuery(moduleTitle: string, courseTitle?: string): string {
  const combined = courseTitle ? `${moduleTitle} ${courseTitle}` : moduleTitle
  const words = combined
    .trim()
    .slice(0, MAX_QUERY_LEN)
    .split(/\s+/)
    .map((w) => w.replace(/[^\w-]/g, '').toLowerCase())
    .filter((w) => w.length > 1 && !STOP_WORDS.has(w))
  const unique = [...new Set(words)]
  return unique.slice(0, 6).join(' ') || combined.trim().slice(0, MAX_QUERY_LEN)
}

async function fetchGoogle(query: string, count: number): Promise<ImageResult[]> {
  const apiKey = process.env.GOOGLE_SEARCH_API_KEY
  const cx = process.env.GOOGLE_SEARCH_ENGINE_ID
  if (!apiKey || !cx) return []
  const num = Math.min(Math.max(1, count), 10)
  const res = await fetch(
    `https://www.googleapis.com/customsearch/v1?key=${encodeURIComponent(apiKey)}&cx=${encodeURIComponent(cx)}&q=${encodeURIComponent(query)}&searchType=image&num=${num}`
  )
  if (!res.ok) return []
  const data = await res.json()
  const results: ImageResult[] = []
  for (const item of data.items ?? []) {
    if (item.link) {
      results.push({
        url: item.link,
        thumbnailUrl: item.image?.thumbnailLink ?? item.link,
        alt: item.title ?? query,
        attribution: item.displayLink ? `Source: ${item.displayLink}` : undefined,
      })
    }
  }
  return results
}

async function fetchPexels(query: string, count: number): Promise<ImageResult[]> {
  const apiKey = process.env.PEXELS_API_KEY
  if (!apiKey) return []
  const perPage = Math.min(Math.max(1, count), 15)
  const res = await fetch(
    `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=${perPage}`,
    { headers: { Authorization: apiKey } }
  )
  if (!res.ok) return []
  const data = await res.json()
  const results: ImageResult[] = []
  for (const photo of data.photos ?? []) {
    const src = photo.src ?? {}
    const url = src.large ?? src.medium ?? src.original ?? photo.url
    if (url) {
      results.push({
        url,
        thumbnailUrl: src.medium ?? src.small,
        alt: photo.alt ?? query,
        attribution: photo.photographer ? `Photo by ${photo.photographer} on Pexels` : undefined,
      })
    }
  }
  return results
}

async function fetchUnsplash(query: string, count: number): Promise<ImageResult[]> {
  const apiKey = process.env.UNSPLASH_ACCESS_KEY
  if (!apiKey) return []
  const perPage = Math.min(Math.max(1, count), 15)
  const res = await fetch(
    `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&per_page=${perPage}`,
    { headers: { Authorization: `Client-ID ${apiKey}` } }
  )
  if (!res.ok) return []
  const data = await res.json()
  const results: ImageResult[] = []
  for (const photo of data.results ?? []) {
    const urls = photo.urls ?? {}
    const url = urls.regular ?? urls.full ?? photo.links?.self
    if (url) {
      results.push({
        url,
        thumbnailUrl: urls.small ?? urls.thumb,
        alt: photo.description ?? photo.alt_description ?? query,
        attribution: photo.user?.name ? `Photo by ${photo.user.name} on Unsplash` : undefined,
      })
    }
  }
  return results
}

/** Fetch from one source with a single retry on failure. */
async function fetchWithRetry(
  source: 'google' | 'pexels' | 'unsplash',
  query: string,
  count: number
): Promise<ImageResult[]> {
  const run = () => {
    switch (source) {
      case 'google': return fetchGoogle(query, count)
      case 'pexels': return fetchPexels(query, count)
      case 'unsplash': return fetchUnsplash(query, count)
    }
  }
  try {
    const results = await run()
    if (results.length > 0) return results
  } catch {
    try {
      return await run()
    } catch {
      return []
    }
  }
  return []
}

/**
 * Search images with cascading sources: Google -> Pexels -> Unsplash.
 * If preferredSource is set, that source is tried first, then the rest in order.
 * Returns up to options.count (default 1) results.
 */
export async function searchImages(
  query: string,
  options: SearchImagesOptions = {}
): Promise<ImageResult[]> {
  const count = Math.min(Math.max(1, options.count ?? 1), 15)
  const q = query.trim().slice(0, MAX_QUERY_LEN) || 'learning'
  const defaultOrder: ('google' | 'pexels' | 'unsplash')[] = ['google', 'pexels', 'unsplash']
  const order = options.preferredSource
    ? [options.preferredSource, ...defaultOrder.filter((s) => s !== options.preferredSource)]
    : defaultOrder
  for (const source of order) {
    const results = await fetchWithRetry(source, q, count)
    if (results.length > 0) return results.slice(0, count)
  }
  return []
}

/** Get a single image for injection into content (e.g. per section). */
export async function getOneImage(
  moduleTitle: string,
  courseTitle?: string
): Promise<ImageResult | null> {
  const query = refineImageQuery(moduleTitle, courseTitle)
  const results = await searchImages(query, { count: 1 })
  return results[0] ?? null
}

/** Get N images for multiple sections (one per section). */
export async function getImagesForSections(
  moduleTitle: string,
  courseTitle: string | undefined,
  sectionCount: number
): Promise<ImageResult[]> {
  if (sectionCount <= 0) return []
  const baseQuery = refineImageQuery(moduleTitle, courseTitle)
  return searchImages(baseQuery, { count: sectionCount })
}

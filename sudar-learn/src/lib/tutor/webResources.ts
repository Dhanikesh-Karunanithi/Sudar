/**
 * Server-only web + image search for tutor resource cards (Learn).
 * Mirrors Studio patterns; API keys are optional — returns [] when unset.
 */

export interface WebSearchResultTutor {
  title: string
  link: string
  snippet: string
}

export interface ImageSearchResultTutor {
  url: string
  thumbnailUrl?: string
  alt?: string
  attribution?: string
}

const MAX_WEB_QUERY = 200
const MAX_IMAGE_QUERY = 100

export async function searchWebForTutor(query: string, count = 3): Promise<WebSearchResultTutor[]> {
  const apiKey = process.env.GOOGLE_SEARCH_API_KEY
  const cx = process.env.GOOGLE_SEARCH_ENGINE_ID
  if (!apiKey || !cx) return []

  const q = query.trim().slice(0, MAX_WEB_QUERY) || 'learning'
  const num = Math.min(Math.max(1, count), 5)

  const url = `https://www.googleapis.com/customsearch/v1?key=${encodeURIComponent(apiKey)}&cx=${encodeURIComponent(cx)}&q=${encodeURIComponent(q)}&num=${num}`

  try {
    const res = await fetch(url)
    if (!res.ok) return []
    const data = (await res.json()) as { items?: Array<{ title?: string; link?: string; snippet?: string }> }
    const out: WebSearchResultTutor[] = []
    for (const item of data.items ?? []) {
      if (item.link) {
        out.push({
          title: item.title ?? '',
          link: item.link,
          snippet: item.snippet ?? '',
        })
      }
    }
    return out
  } catch {
    return []
  }
}

async function fetchGoogleImages(query: string, count: number): Promise<ImageSearchResultTutor[]> {
  const apiKey = process.env.GOOGLE_SEARCH_API_KEY
  const cx = process.env.GOOGLE_SEARCH_ENGINE_ID
  if (!apiKey || !cx) return []
  const num = Math.min(Math.max(1, count), 5)
  const res = await fetch(
    `https://www.googleapis.com/customsearch/v1?key=${encodeURIComponent(apiKey)}&cx=${encodeURIComponent(cx)}&q=${encodeURIComponent(query)}&searchType=image&num=${num}`,
  )
  if (!res.ok) return []
  const data = (await res.json()) as {
    items?: Array<{ title?: string; link?: string; image?: { thumbnailLink?: string }; displayLink?: string }>
  }
  const results: ImageSearchResultTutor[] = []
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

export async function searchImagesForTutor(query: string, count = 2): Promise<ImageSearchResultTutor[]> {
  const q = query.trim().slice(0, MAX_IMAGE_QUERY) || 'learning'
  return fetchGoogleImages(q, count)
}

/**
 * Heuristic: learner is asking for external references or visuals.
 */
export function detectsTutorResourceIntent(message: string): boolean {
  return /\b(image|images|picture|pictures|diagram|photo|illustration|visual|search the web|from the web|wikipedia|source|reference|further reading|read more|external)\b/i.test(
    message,
  )
}

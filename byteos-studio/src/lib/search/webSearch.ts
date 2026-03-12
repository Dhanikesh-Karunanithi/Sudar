/**
 * ByteOS Studio — Google Custom Search (web) for research-backed content generation.
 * Uses the same env vars as image search: GOOGLE_SEARCH_API_KEY, GOOGLE_SEARCH_ENGINE_ID.
 */

export interface WebSearchResult {
  title: string
  link: string
  snippet: string
}

const MAX_QUERY_LEN = 200
const DEFAULT_COUNT = 8
const MAX_COUNT = 10

/**
 * Run a web search via Google Custom Search API (no searchType=image).
 * Returns title, link, and snippet per result for use in LLM context and citations.
 */
export async function searchWeb(
  query: string,
  count: number = DEFAULT_COUNT
): Promise<WebSearchResult[]> {
  const apiKey = process.env.GOOGLE_SEARCH_API_KEY
  const cx = process.env.GOOGLE_SEARCH_ENGINE_ID
  if (!apiKey || !cx) return []

  const q = query.trim().slice(0, MAX_QUERY_LEN) || 'learning'
  const num = Math.min(Math.max(1, count), MAX_COUNT)

  const url = `https://www.googleapis.com/customsearch/v1?key=${encodeURIComponent(apiKey)}&cx=${encodeURIComponent(cx)}&q=${encodeURIComponent(q)}&num=${num}`

  try {
    const res = await fetch(url)
    if (!res.ok) return []
    const data = await res.json()
    const results: WebSearchResult[] = []
    for (const item of data.items ?? []) {
      if (item.link) {
        results.push({
          title: item.title ?? '',
          link: item.link,
          snippet: item.snippet ?? '',
        })
      }
    }
    return results
  } catch {
    return []
  }
}

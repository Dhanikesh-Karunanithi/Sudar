import type { ExternalCourseMetadata, ExternalCourseSearchResult, ProviderAdapter } from './types'

/** Khan Academy — URL-based import; no public search API for catalog. */
export const khanAdapter: ProviderAdapter = {
  slug: 'khan',
  label: 'Khan Academy',

  async search(query: string): Promise<ExternalCourseSearchResult[]> {
    const q = query.trim()
    if (!q) return []
    const slug = encodeURIComponent(q.toLowerCase().replace(/\s+/g, '-'))
    const url = q.startsWith('http')
      ? q
      : `https://www.khanacademy.org/computing/computer-science/${slug}`
    return [
      {
        providerCourseId: url,
        title: q.startsWith('http') ? 'Khan Academy course' : `Khan Academy: ${query}`,
        description: 'Open course on Khan Academy',
        externalUrl: url,
      },
    ]
  },

  async fetchCourseDetails(providerCourseId: string): Promise<ExternalCourseMetadata> {
    const externalUrl = providerCourseId.startsWith('http')
      ? providerCourseId
      : `https://www.khanacademy.org/${providerCourseId}`

    return {
      provider: 'khan_academy',
      providerCourseId: externalUrl,
      title: 'Khan Academy course',
      description: 'Free interactive lessons on Khan Academy.',
      externalUrl,
      embedUrl: null,
      difficulty: 'beginner',
      requiresSignIn: false,
      sections: [],
      topics: ['khan academy', 'open course'],
    }
  },
}

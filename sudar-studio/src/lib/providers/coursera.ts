import type { ExternalCourseMetadata, ExternalCourseSearchResult, ProviderAdapter } from './types'

/** Coursera — metadata via URL/slug; full API requires partner credentials. */
export const courseraAdapter: ProviderAdapter = {
  slug: 'coursera',
  label: 'Coursera',

  async search(query: string, limit = 8): Promise<ExternalCourseSearchResult[]> {
    const q = encodeURIComponent(query.trim())
    return Array.from({ length: Math.min(limit, 1) }, () => ({
      providerCourseId: q,
      title: `Coursera search: ${query}`,
      description: 'Import by pasting a Coursera course URL for full metadata.',
      externalUrl: `https://www.coursera.org/search?query=${q}`,
    }))
  },

  async fetchCourseDetails(providerCourseId: string): Promise<ExternalCourseMetadata> {
    const externalUrl = providerCourseId.startsWith('http')
      ? providerCourseId
      : `https://www.coursera.org/learn/${providerCourseId}`

    const slug = externalUrl.split('/learn/')[1]?.split(/[/?#]/)[0] ?? providerCourseId

    return {
      provider: 'coursera',
      providerCourseId: slug,
      title: `Coursera: ${slug.replace(/-/g, ' ')}`,
      description: 'Professional course on Coursera. Learners may need a Coursera account.',
      externalUrl,
      embedUrl: null,
      difficulty: 'intermediate',
      requiresSignIn: true,
      signInInstructions: 'Sign in to Coursera when prompted in the viewer or open the course in a new tab.',
      certAvailable: true,
      sections: [],
      topics: ['coursera', slug],
    }
  },
}

import type { ExternalCourseMetadata, ExternalCourseSearchResult, ProviderAdapter } from './types'

const EDX_API = 'https://courses.edx.org/api/courses/v1'

export const edxAdapter: ProviderAdapter = {
  slug: 'edx',
  label: 'edX',

  async search(query: string, limit = 8): Promise<ExternalCourseSearchResult[]> {
    try {
      const params = new URLSearchParams({
        search: query,
        page_size: String(Math.min(limit, 12)),
      })
      const res = await fetch(`${EDX_API}/courses/?${params}`)
      if (!res.ok) throw new Error('edX API unavailable')
      const data = (await res.json()) as {
        results?: Array<{
          id?: string
          name?: string
          short_description?: string
          course_url?: string
          media?: { course_image?: { uri?: string } }
        }>
      }
      return (data.results ?? []).map((c) => ({
        providerCourseId: c.id ?? '',
        title: c.name ?? 'edX course',
        description: c.short_description?.slice(0, 500) ?? null,
        externalUrl: c.course_url?.startsWith('http')
          ? c.course_url
          : `https://courses.edx.org${c.course_url ?? ''}`,
        thumbnailUrl: c.media?.course_image?.uri ?? null,
      }))
    } catch {
      return [
        {
          providerCourseId: query,
          title: `edX: ${query}`,
          description: 'Search edX or paste a course URL to import.',
          externalUrl: `https://www.edx.org/search?q=${encodeURIComponent(query)}`,
        },
      ]
    }
  },

  async fetchCourseDetails(providerCourseId: string): Promise<ExternalCourseMetadata> {
    const courseId = providerCourseId.includes('+') ? providerCourseId : providerCourseId
    try {
      const res = await fetch(`${EDX_API}/courses/${encodeURIComponent(courseId)}/`)
      if (res.ok) {
        const c = (await res.json()) as {
          id?: string
          name?: string
          short_description?: string
          course_url?: string
          media?: { course_image?: { uri?: string } }
        }
        const externalUrl = c.course_url?.startsWith('http')
          ? c.course_url
          : `https://courses.edx.org/courses/${c.id}/about`
        return {
          provider: 'edx',
          providerCourseId: c.id ?? courseId,
          title: c.name ?? 'edX course',
          description: c.short_description?.slice(0, 4000) ?? null,
          externalUrl,
          embedUrl: null,
          thumbnailUrl: c.media?.course_image?.uri ?? null,
          difficulty: 'intermediate',
          requiresSignIn: true,
          signInInstructions: 'Create or sign in to an edX account to access course materials.',
          sections: [],
          topics: [],
        }
      }
    } catch {
      /* fallback */
    }

    const externalUrl = providerCourseId.startsWith('http')
      ? providerCourseId
      : `https://www.edx.org/learn/${providerCourseId}`

    return {
      provider: 'edx',
      providerCourseId: courseId,
      title: `edX course`,
      description: null,
      externalUrl,
      requiresSignIn: true,
      signInInstructions: 'Sign in to edX to access this course.',
      sections: [],
      topics: [],
    }
  },
}

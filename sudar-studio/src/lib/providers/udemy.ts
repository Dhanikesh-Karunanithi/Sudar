import type { ExternalCourseMetadata, ExternalCourseSearchResult, ProviderAdapter } from './types'

const UDEMY_API = 'https://www.udemy.com/api-2.0'

function getCredentials(): { clientId: string; clientSecret: string } | null {
  const clientId = process.env.UDEMY_CLIENT_ID?.trim()
  const clientSecret = process.env.UDEMY_CLIENT_SECRET?.trim()
  if (!clientId || !clientSecret) return null
  return { clientId, clientSecret }
}

async function udemyFetch(path: string): Promise<Response | null> {
  const creds = getCredentials()
  if (!creds) return null
  const auth = Buffer.from(`${creds.clientId}:${creds.clientSecret}`).toString('base64')
  return fetch(`${UDEMY_API}${path}`, {
    headers: { Authorization: `Basic ${auth}`, Accept: 'application/json' },
  })
}

export const udemyAdapter: ProviderAdapter = {
  slug: 'udemy',
  label: 'Udemy',

  async search(query: string, limit = 8): Promise<ExternalCourseSearchResult[]> {
    const res = await udemyFetch(
      `/courses/?search=${encodeURIComponent(query)}&page_size=${Math.min(limit, 12)}`,
    )
    if (!res?.ok) {
      return [
        {
          providerCourseId: query,
          title: `Udemy: ${query}`,
          description: 'Set UDEMY_CLIENT_ID and UDEMY_CLIENT_SECRET for API search.',
          externalUrl: `https://www.udemy.com/courses/search/?q=${encodeURIComponent(query)}`,
        },
      ]
    }
    const data = (await res.json()) as {
      results?: Array<{
        id?: number
        title?: string
        headline?: string
        url?: string
        visible_instructors?: Array<{ display_name?: string }>
        avg_rating?: number
        image_480x270?: string
      }>
    }
    return (data.results ?? []).map((c) => ({
      providerCourseId: String(c.id ?? ''),
      title: c.title ?? 'Udemy course',
      description: c.headline?.slice(0, 500) ?? null,
      instructor: c.visible_instructors?.[0]?.display_name ?? null,
      externalUrl: c.url?.startsWith('http') ? c.url : `https://www.udemy.com${c.url ?? ''}`,
      thumbnailUrl: c.image_480x270 ?? null,
      rating: c.avg_rating ?? null,
    }))
  },

  async fetchCourseDetails(providerCourseId: string): Promise<ExternalCourseMetadata> {
    const res = await udemyFetch(`/courses/${providerCourseId}/`)
    if (!res?.ok) {
      return {
        provider: 'udemy',
        providerCourseId,
        title: 'Udemy course',
        description: null,
        externalUrl: `https://www.udemy.com/course/${providerCourseId}/`,
        requiresSignIn: true,
        signInInstructions: 'Sign in to your Udemy account in the viewer, then start the course.',
        difficulty: 'intermediate',
        sections: [],
        topics: [],
      }
    }
    const c = (await res.json()) as {
      id?: number
      title?: string
      headline?: string
      description?: string
      url?: string
      visible_instructors?: Array<{ display_name?: string; description?: string }>
      avg_rating?: number
      num_subscribers?: number
      content_length_video?: number
      image_480x270?: string
      primary_category?: { title?: string }
      instructional_level?: string
    }
    const mins = c.content_length_video ? Math.round(c.content_length_video / 60) : null
    return {
      provider: 'udemy',
      providerCourseId: String(c.id ?? providerCourseId),
      title: c.title ?? 'Udemy course',
      description: (c.description ?? c.headline)?.slice(0, 4000) ?? null,
      instructor: c.visible_instructors?.[0]?.display_name ?? null,
      instructorBio: c.visible_instructors?.[0]?.description?.slice(0, 1500) ?? null,
      externalUrl: c.url?.startsWith('http') ? c.url : `https://www.udemy.com${c.url ?? ''}`,
      embedUrl: null,
      rating: c.avg_rating ?? null,
      estimatedDurationMins: mins,
      difficulty: mapUdemyLevel(c.instructional_level),
      thumbnailUrl: c.image_480x270 ?? null,
      requiresSignIn: true,
      signInInstructions: 'Sign in to Udemy in the viewer window to access course videos.',
      topics: c.primary_category?.title ? [c.primary_category.title] : [],
      providerCategories: c.primary_category?.title ? [c.primary_category.title] : [],
      sections: [],
    }
  },
}

function mapUdemyLevel(level?: string): string {
  const l = (level ?? '').toLowerCase()
  if (l.includes('beginner') && l.includes('expert')) return 'intermediate'
  if (l.includes('beginner')) return 'beginner'
  if (l.includes('expert') || l.includes('advanced')) return 'advanced'
  return 'intermediate'
}

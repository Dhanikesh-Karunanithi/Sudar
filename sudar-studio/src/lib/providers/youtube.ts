import type { ExternalCourseMetadata, ExternalCourseSearchResult } from './types'
import type { ProviderAdapter } from './types'

const YT_API = 'https://www.googleapis.com/youtube/v3'

function getApiKey(): string | null {
  return process.env.YOUTUBE_API_KEY?.trim() || process.env.GOOGLE_API_KEY?.trim() || null
}

function parsePlaylistOrVideoId(input: string): { playlistId?: string; videoId?: string } {
  const trimmed = input.trim()
  if (!trimmed.includes('/')) {
    if (trimmed.length === 11) return { videoId: trimmed }
    if (trimmed.startsWith('PL')) return { playlistId: trimmed }
    return { playlistId: trimmed }
  }
  try {
    const url = new URL(trimmed)
    const list = url.searchParams.get('list')
    if (list) return { playlistId: list }
    const v = url.searchParams.get('v')
    if (v) return { videoId: v }
    if (url.hostname.includes('youtu.be')) {
      const id = url.pathname.replace(/^\//, '').split('/')[0]
      if (id) return { videoId: id }
    }
  } catch {
    /* ignore */
  }
  return { playlistId: trimmed }
}

function buildEmbedUrl(playlistId?: string, videoId?: string): string | null {
  if (playlistId) return `https://www.youtube.com/embed/videoseries?list=${playlistId}`
  if (videoId) return `https://www.youtube.com/embed/${videoId}`
  return null
}

function buildCanonicalUrl(playlistId?: string, videoId?: string): string {
  if (playlistId) return `https://www.youtube.com/playlist?list=${playlistId}`
  if (videoId) return `https://www.youtube.com/watch?v=${videoId}`
  return ''
}

export const youtubeAdapter: ProviderAdapter = {
  slug: 'youtube',
  label: 'YouTube',

  async search(query: string, limit = 8): Promise<ExternalCourseSearchResult[]> {
    const key = getApiKey()
    if (!key) {
      const { playlistId, videoId } = parsePlaylistOrVideoId(query)
      const id = playlistId ?? videoId ?? query
      if (!id) return []
      return [
        {
          providerCourseId: id,
          title: `YouTube: ${id}`,
          description: 'Import via URL — set YOUTUBE_API_KEY for search.',
          externalUrl: buildCanonicalUrl(playlistId, videoId),
        },
      ]
    }

    const params = new URLSearchParams({
      part: 'snippet',
      type: 'playlist',
      maxResults: String(Math.min(limit, 25)),
      q: query,
      key,
    })
    const res = await fetch(`${YT_API}/search?${params}`)
    if (!res.ok) return []
    const data = (await res.json()) as {
      items?: Array<{
        id?: { playlistId?: string }
        snippet?: { title?: string; description?: string; channelTitle?: string; thumbnails?: { medium?: { url?: string } } }
      }>
    }
    return (data.items ?? [])
      .filter((i) => i.id?.playlistId)
      .map((i) => {
        const pid = i.id!.playlistId!
        return {
          providerCourseId: pid,
          title: i.snippet?.title ?? 'YouTube playlist',
          description: i.snippet?.description?.slice(0, 500) ?? null,
          instructor: i.snippet?.channelTitle ?? null,
          externalUrl: buildCanonicalUrl(pid),
          thumbnailUrl: i.snippet?.thumbnails?.medium?.url ?? null,
        }
      })
  },

  async fetchCourseDetails(providerCourseId: string): Promise<ExternalCourseMetadata> {
    const { playlistId, videoId } = parsePlaylistOrVideoId(providerCourseId)
    const id = playlistId ?? videoId ?? providerCourseId
    const key = getApiKey()
    let title = `YouTube course ${id}`
    let description: string | null = null
    let instructor: string | null = null
    let thumbnailUrl: string | null = null

    if (key && playlistId) {
      const params = new URLSearchParams({ part: 'snippet,contentDetails', id: playlistId, key })
      const res = await fetch(`${YT_API}/playlists?${params}`)
      if (res.ok) {
        const data = (await res.json()) as {
          items?: Array<{
            snippet?: { title?: string; description?: string; channelTitle?: string; thumbnails?: { medium?: { url?: string } } }
            contentDetails?: { itemCount?: number }
          }>
        }
        const item = data.items?.[0]
        if (item?.snippet) {
          title = item.snippet.title ?? title
          description = item.snippet.description?.slice(0, 2000) ?? null
          instructor = item.snippet.channelTitle ?? null
          thumbnailUrl = item.snippet.thumbnails?.medium?.url ?? null
        }
      }
    }

    const externalUrl = buildCanonicalUrl(playlistId, videoId)
    const embedUrl = buildEmbedUrl(playlistId, videoId)

    return {
      provider: 'youtube',
      providerCourseId: id,
      title,
      description,
      instructor,
      externalUrl,
      embedUrl,
      thumbnailUrl,
      estimatedDurationMins: null,
      difficulty: 'beginner',
      sections: [],
      topics: [],
    }
  },
}

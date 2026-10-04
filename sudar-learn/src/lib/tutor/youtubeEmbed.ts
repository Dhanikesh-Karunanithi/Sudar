import { resolveExternalEmbedUrl } from '@/lib/courses/externalProviders'

const YOUTUBE_ID_RE = /^[a-zA-Z0-9_-]{6,20}$/

/**
 * Resolve a YouTube video id or URL to a safe embed URL, or null if not allowlisted.
 */
export function resolveYoutubeEmbedUrl(input: {
  url?: string | null
  video_id?: string | null
}): string | null {
  const id = input.video_id?.trim()
  if (id && YOUTUBE_ID_RE.test(id)) {
    return `https://www.youtube.com/embed/${id}`
  }

  const raw = input.url?.trim()
  if (!raw) return null

  if (YOUTUBE_ID_RE.test(raw)) {
    return `https://www.youtube.com/embed/${raw}`
  }

  const embed = resolveExternalEmbedUrl({
    externalProvider: 'youtube',
    externalUrl: raw,
    embedUrl: null,
  })
  if (!embed) return null
  try {
    const host = new URL(embed).hostname.replace(/^www\./, '')
    if (host !== 'youtube.com' && host !== 'youtube-nocookie.com') return null
    if (!embed.includes('/embed/')) return null
    return embed.startsWith('https://') ? embed : null
  } catch {
    return null
  }
}

export function youtubeWatchUrlFromEmbed(embedUrl: string): string | null {
  try {
    const u = new URL(embedUrl)
    const parts = u.pathname.split('/').filter(Boolean)
    const idx = parts.indexOf('embed')
    const id = idx >= 0 ? parts[idx + 1] : null
    if (id && id !== 'videoseries' && YOUTUBE_ID_RE.test(id)) {
      return `https://www.youtube.com/watch?v=${id}`
    }
    const list = u.searchParams.get('list')
    if (list) return `https://www.youtube.com/playlist?list=${list}`
  } catch {
    return null
  }
  return null
}

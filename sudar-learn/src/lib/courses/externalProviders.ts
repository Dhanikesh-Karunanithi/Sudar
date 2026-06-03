/** Labels, embed resolution, and styling for external open-course providers. */

export type ExternalProviderId =
  | 'youtube'
  | 'khan_academy'
  | 'khan'
  | 'mit_ocw'
  | 'udemy'
  | 'coursera'
  | 'edx'
  | 'manual'
  | 'custom'

export type ExternalProviderMeta = {
  id: ExternalProviderId
  label: string
  shortLabel: string
  accentClass: string
  description: string
}

export const EXTERNAL_PROVIDERS: ExternalProviderMeta[] = [
  {
    id: 'youtube',
    label: 'YouTube',
    shortLabel: 'YouTube',
    accentClass: 'bg-destructive/10 text-destructive border-destructive/30',
    description: 'Video lectures and playlists',
  },
  {
    id: 'khan_academy',
    label: 'Khan Academy',
    shortLabel: 'Khan Academy',
    accentClass: 'bg-success/10 text-success border-success/30',
    description: 'Free interactive lessons',
  },
  {
    id: 'khan',
    label: 'Khan Academy',
    shortLabel: 'Khan',
    accentClass: 'bg-success/10 text-success border-success/30',
    description: 'Khan Academy open courses',
  },
  {
    id: 'udemy',
    label: 'Udemy',
    shortLabel: 'Udemy',
    accentClass: 'bg-warning/10 text-warning border-warning/30',
    description: 'Professional video courses',
  },
  {
    id: 'coursera',
    label: 'Coursera',
    shortLabel: 'Coursera',
    accentClass: 'bg-primary/10 text-primary border-primary/30',
    description: 'University and industry certificates',
  },
  {
    id: 'edx',
    label: 'edX',
    shortLabel: 'edX',
    accentClass: 'bg-primary/10 text-primary border-primary/30',
    description: 'University open courses',
  },
  {
    id: 'mit_ocw',
    label: 'MIT OpenCourseWare',
    shortLabel: 'MIT OCW',
    accentClass: 'bg-primary/10 text-primary border-primary/30',
    description: 'University-level open materials',
  },
  {
    id: 'manual',
    label: 'External link',
    shortLabel: 'External',
    accentClass: 'bg-muted text-muted-foreground border-border',
    description: 'Manually imported URL',
  },
  {
    id: 'custom',
    label: 'Web',
    shortLabel: 'Web',
    accentClass: 'bg-muted text-muted-foreground border-border',
    description: 'Other trusted open resources',
  },
]

const PROVIDER_META: Record<string, ExternalProviderMeta> = Object.fromEntries(
  EXTERNAL_PROVIDERS.map((p) => [p.id, p]),
)

export function getExternalProviderMeta(provider: string | null | undefined): ExternalProviderMeta {
  const key = provider ?? 'custom'
  return PROVIDER_META[key] ?? PROVIDER_META.custom
}

export function isExternalProviderId(value: string | null | undefined): value is ExternalProviderId {
  return value != null && value in PROVIDER_META
}

/** Prefer stored embed_url; derive YouTube embeds from external_url when missing. */
export function resolveExternalEmbedUrl(opts: {
  externalProvider?: string | null
  externalUrl?: string | null
  embedUrl?: string | null
}): string | null {
  const stored = opts.embedUrl?.trim()
  if (stored) return stored

  const url = opts.externalUrl?.trim()
  if (!url) return null

  try {
    const parsed = new URL(url)
    const host = parsed.hostname.replace(/^www\./, '')

    if (host === 'youtube.com' || host === 'm.youtube.com') {
      const list = parsed.searchParams.get('list')
      if (list) return `https://www.youtube.com/embed/videoseries?list=${list}`
      const v = parsed.searchParams.get('v')
      if (v) return `https://www.youtube.com/embed/${v}`
    }
    if (host === 'youtu.be') {
      const id = parsed.pathname.replace(/^\//, '').split('/')[0]
      if (id) return `https://www.youtube.com/embed/${id}`
    }
  } catch {
    return null
  }

  // Attempt in-app iframe for other URLs; many sites block embedding (handled in UI fallback).
  return url
}

export function providerAllowsInAppEmbed(provider: string | null | undefined): boolean {
  return (
    provider === 'youtube' ||
    provider === 'custom' ||
    provider === 'manual' ||
    provider === 'khan' ||
    provider === 'khan_academy'
  )
}

export function providerRequiresSignIn(provider: string | null | undefined): boolean {
  return provider === 'udemy' || provider === 'coursera' || provider === 'edx'
}

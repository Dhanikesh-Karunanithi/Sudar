/** Labels and styling for external open-course providers. */

export type ExternalProviderId = 'youtube' | 'khan_academy' | 'mit_ocw' | 'custom'

const PROVIDER_META: Record<
  ExternalProviderId,
  { label: string; shortLabel: string; accentClass: string }
> = {
  youtube: {
    label: 'YouTube',
    shortLabel: 'YouTube',
    accentClass: 'bg-destructive/10 text-destructive border-destructive/30',
  },
  khan_academy: {
    label: 'Khan Academy',
    shortLabel: 'Khan Academy',
    accentClass: 'bg-success/10 text-success border-success/30',
  },
  mit_ocw: {
    label: 'MIT OpenCourseWare',
    shortLabel: 'MIT OCW',
    accentClass: 'bg-primary/10 text-primary border-primary/30',
  },
  custom: {
    label: 'External resource',
    shortLabel: 'Web',
    accentClass: 'bg-muted text-muted-foreground border-border',
  },
}

export function getExternalProviderMeta(provider: string | null | undefined) {
  const key = (provider ?? 'custom') as ExternalProviderId
  return PROVIDER_META[key] ?? PROVIDER_META.custom
}

export function isExternalProviderId(value: string | null | undefined): value is ExternalProviderId {
  return value === 'youtube' || value === 'khan_academy' || value === 'mit_ocw' || value === 'custom'
}

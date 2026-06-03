import type { ExternalProviderSlug } from '../../../../shared/external-courses/types'
import { courseraAdapter } from './coursera'
import { edxAdapter } from './edx'
import { khanAdapter } from './khan'
import { manualCourseMetadata } from './manual'
import type { ManualImportInput, ProviderAdapter } from './types'
import { udemyAdapter } from './udemy'
import { youtubeAdapter } from './youtube'

export type { ManualImportInput, ProviderAdapter, ExternalCourseMetadata } from './types'
export { manualCourseMetadata }

const ADAPTERS: Record<string, ProviderAdapter> = {
  youtube: youtubeAdapter,
  khan: khanAdapter,
  khan_academy: khanAdapter,
  udemy: udemyAdapter,
  coursera: courseraAdapter,
  edx: edxAdapter,
}

export function getProviderAdapter(provider: string): ProviderAdapter | null {
  return ADAPTERS[provider] ?? null
}

export const IMPORTABLE_PROVIDERS: { slug: ExternalProviderSlug; label: string }[] = [
  { slug: 'youtube', label: 'YouTube' },
  { slug: 'khan', label: 'Khan Academy' },
  { slug: 'udemy', label: 'Udemy' },
  { slug: 'coursera', label: 'Coursera' },
  { slug: 'edx', label: 'edX' },
  { slug: 'manual', label: 'Manual URL' },
]

export async function resolveExternalMetadata(
  provider: string,
  providerCourseId: string | undefined,
  manual?: ManualImportInput,
) {
  if (provider === 'manual' && manual) {
    return manualCourseMetadata(manual)
  }
  const adapter = getProviderAdapter(provider)
  if (!adapter) throw new Error(`Unsupported provider: ${provider}`)
  if (!providerCourseId?.trim()) throw new Error('provider_course_id is required')
  return adapter.fetchCourseDetails(providerCourseId.trim())
}

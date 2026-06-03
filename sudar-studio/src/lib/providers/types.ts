import type {
  ContentAccessMode,
  ExternalCourseMetadata,
  ExternalProviderSlug,
} from '../../../../shared/external-courses/types'

export type { ContentAccessMode, ExternalCourseMetadata, ExternalProviderSlug }

export interface ExternalCourseSearchResult {
  providerCourseId: string
  title: string
  description: string | null
  instructor?: string | null
  externalUrl: string
  thumbnailUrl?: string | null
  rating?: number | null
}

export interface ProviderAdapter {
  slug: ExternalProviderSlug
  label: string
  search(query: string, limit?: number): Promise<ExternalCourseSearchResult[]>
  fetchCourseDetails(providerCourseId: string): Promise<ExternalCourseMetadata>
}

export interface ManualImportInput {
  title: string
  description?: string | null
  externalUrl: string
  embedUrl?: string | null
  instructor?: string | null
  difficulty?: string | null
  estimatedDurationMins?: number | null
  topics?: string[]
  sections?: { title: string }[]
  requiresSignIn?: boolean
  signInInstructions?: string | null
}

/** Shared types for external course import and tutor context. */

export type ExternalProviderSlug =
  | 'youtube'
  | 'khan_academy'
  | 'khan'
  | 'mit_ocw'
  | 'udemy'
  | 'coursera'
  | 'edx'
  | 'manual'
  | 'custom'

export type ContentAccessMode = 'iframe_only' | 'tutor_access' | 'both'

export type ExternalCourseSyncStatus = 'pending' | 'synced' | 'error' | 'outdated'

export interface ExternalCourseSection {
  title: string
  description?: string
}

export interface ExternalCourseMetadata {
  provider: ExternalProviderSlug
  providerCourseId: string
  title: string
  description: string | null
  instructor?: string | null
  instructorBio?: string | null
  rating?: number | null
  durationHours?: number | null
  estimatedDurationMins?: number | null
  difficulty?: string | null
  certAvailable?: boolean
  videoCount?: number | null
  thumbnailUrl?: string | null
  externalUrl: string
  embedUrl?: string | null
  sections?: ExternalCourseSection[]
  topics?: string[]
  providerCategories?: string[]
  requiresSignIn?: boolean
  signInInstructions?: string | null
}

export interface ExternalCourseEngagementEntry {
  views: number
  clicks: number
  duration_secs: number
  completed: boolean
  last_visited: string | null
}

export type ExternalCourseEngagementMap = Record<string, ExternalCourseEngagementEntry>

export interface OrgExternalCoursePolicy {
  allow_external_courses?: boolean
  require_learner_consent?: boolean
  default_content_access_mode?: ContentAccessMode
  default_allow_tutor_discussion?: boolean
  enabled_providers?: ExternalProviderSlug[]
}

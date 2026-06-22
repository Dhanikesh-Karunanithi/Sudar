import { z } from 'zod'

export const FEEDBACK_CATEGORIES = ['bug', 'ux', 'feature', 'other'] as const
export type FeedbackCategory = (typeof FEEDBACK_CATEGORIES)[number]

export const FEEDBACK_SURFACES = ['learn', 'studio'] as const
export type FeedbackSurface = (typeof FEEDBACK_SURFACES)[number]

export const FEEDBACK_STATUSES = ['new', 'reviewed', 'resolved'] as const
export type FeedbackStatus = (typeof FEEDBACK_STATUSES)[number]

export const EARLY_ACCESS_FEEDBACK_TIERS = new Set(['early_access', 'tester', 'unlimited'])

export const earlyAccessFeedbackBodySchema = z.object({
  category: z.enum(FEEDBACK_CATEGORIES),
  message: z.string().min(10).max(8000),
  page_route: z.string().max(500).optional(),
  urls: z.array(z.string().url().max(2000)).max(10).default([]),
  attachment_urls: z.array(z.string().url().max(2000)).max(6).default([]),
  surface: z.enum(FEEDBACK_SURFACES),
  context: z.record(z.unknown()).default({}),
})

export const feedbackStatusPatchSchema = z.object({
  id: z.string().uuid(),
  status: z.enum(FEEDBACK_STATUSES),
})

export type EarlyAccessFeedbackBody = z.infer<typeof earlyAccessFeedbackBodySchema>

export const FEEDBACK_CATEGORY_LABELS: Record<FeedbackCategory, string> = {
  bug: 'Bug or broken feature',
  ux: 'UX / usability',
  feature: 'Feature idea',
  other: 'Other feedback',
}

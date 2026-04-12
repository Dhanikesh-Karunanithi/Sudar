import { z } from 'zod'
import {
  EXPERIENCE_PACK_SLUGS,
  type ExperiencePackSlug,
  isExperiencePackSlug,
} from '@/lib/themes/experiencePacks'

export const experiencePackSlugSchema = z.enum(EXPERIENCE_PACK_SLUGS)

export const experiencePackSourceSchema = z.enum(['author', 'ai_suggested', 'default'])

export const courseExperienceSettingsSchema = z
  .object({
    experiencePack: experiencePackSlugSchema.optional(),
    experiencePackSource: experiencePackSourceSchema.optional(),
  })
  .strict()

export type CourseExperienceSettings = z.infer<typeof courseExperienceSettingsSchema>

export function parseExperienceSettings(settings: unknown): {
  pack: ExperiencePackSlug
  source: z.infer<typeof experiencePackSourceSchema> | undefined
} {
  if (!settings || typeof settings !== 'object') {
    return { pack: 'none', source: undefined }
  }
  const raw = (settings as Record<string, unknown>).experiencePack
  const src = (settings as Record<string, unknown>).experiencePackSource
  const packParsed = experiencePackSlugSchema.safeParse(raw)
  const pack: ExperiencePackSlug = packParsed.success ? packParsed.data : 'none'
  const sourceParsed = experiencePackSourceSchema.safeParse(src)
  return {
    pack,
    source: sourceParsed.success ? sourceParsed.data : undefined,
  }
}

/**
 * After `{ ...previous, ...patch }`, re-validate experience keys from `patch`.
 * Invalid `experiencePack` values are dropped in favor of `previous`.
 */
export function mergeExperienceIntoSettings(
  merged: Record<string, unknown>,
  patch: Record<string, unknown>,
  previous: Record<string, unknown>
): Record<string, unknown> {
  const next = { ...merged }
  if ('experiencePack' in patch) {
    const p = experiencePackSlugSchema.safeParse(patch.experiencePack)
    if (p.success) {
      next.experiencePack = p.data
    } else if (patch.experiencePack === null || patch.experiencePack === '') {
      delete next.experiencePack
      delete next.experiencePackSource
    } else if (experiencePackSlugSchema.safeParse(previous.experiencePack).success) {
      next.experiencePack = previous.experiencePack
    } else {
      delete next.experiencePack
    }
  }
  if ('experiencePackSource' in patch) {
    const s = experiencePackSourceSchema.safeParse(patch.experiencePackSource)
    if (s.success) next.experiencePackSource = s.data
  }
  return next
}

export function normalizeExperiencePackFromUnknown(value: unknown): ExperiencePackSlug {
  if (value === null || value === undefined || value === '') return 'none'
  if (typeof value === 'string' && isExperiencePackSlug(value)) return value
  return 'none'
}

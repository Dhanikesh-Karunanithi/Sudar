import { z } from 'zod'
import { EXPERIENCE_PACK_SLUGS } from '@/lib/themes/experiencePacks'

export const experiencePackSlugSchema = z.enum(EXPERIENCE_PACK_SLUGS)

export const experiencePackSourceSchema = z.enum(['author', 'ai_suggested', 'default'])

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

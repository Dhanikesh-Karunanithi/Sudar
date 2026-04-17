/**
 * Mirror of sudar-learn/src/lib/themes/experiencePacks.ts — keep labels and slugs in sync.
 */

export const EXPERIENCE_PACK_SLUGS = ['none', 'ocean', 'forest', 'space'] as const
export type ExperiencePackSlug = (typeof EXPERIENCE_PACK_SLUGS)[number]

export type ExperienceParticleDensity = 'low' | 'medium'

export interface ExperiencePack {
  slug: Exclude<ExperiencePackSlug, 'none'>
  label: string
  description: string
  particleDensity: ExperienceParticleDensity
}

export const EXPERIENCE_PACKS: Record<
  Exclude<ExperiencePackSlug, 'none'>,
  ExperiencePack
> = {
  ocean: {
    slug: 'ocean',
    label: 'Ocean',
    description: 'Fluid gradients and soft motion suggesting depth and water.',
    particleDensity: 'medium',
  },
  forest: {
    slug: 'forest',
    label: 'Forest',
    description: 'Organic greens, gentle drift, and dappled light.',
    particleDensity: 'low',
  },
  space: {
    slug: 'space',
    label: 'Night sky',
    description: 'Deep space tones with subtle starfield shimmer.',
    particleDensity: 'low',
  },
}

export function suggestExperiencePackFromText(title: string, tags?: string[]): ExperiencePackSlug {
  const blob = [title, ...(tags ?? [])].join(' ').toLowerCase()
  const ocean = /\b(ocean|marine|sea|aquatic|fish|coral|whale|nautical|diving|saltwater|tsunami|wave|beach|coast)\b/i
  const forest = /\b(forest|tree|woodland|jungle|rainforest|botany|plant|leaf|wildlife|hiking|nature|green|sustainab)\b/i
  const space = /\b(space|orbit|planet|star|galaxy|cosmos|astronaut|rocket|nasa|astro|lunar|solar system|constellation)\b/i
  if (ocean.test(blob)) return 'ocean'
  if (forest.test(blob)) return 'forest'
  if (space.test(blob)) return 'space'
  return 'none'
}

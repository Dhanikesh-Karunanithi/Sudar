/**
 * Curated immersive experience packs for the course shell (Sudar Learn).
 * Keep in sync with byteos-studio/src/lib/themes/experiencePacks.ts
 */

export const EXPERIENCE_PACK_SLUGS = ['none', 'ocean', 'forest', 'space'] as const
export type ExperiencePackSlug = (typeof EXPERIENCE_PACK_SLUGS)[number]

export type ExperienceParticleDensity = 'low' | 'medium'

export interface ExperiencePack {
  slug: Exclude<ExperiencePackSlug, 'none'>
  label: string
  description: string
  /** Static hint for motion budget — not AI-controlled. */
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

export function isExperiencePackSlug(s: string | null | undefined): s is ExperiencePackSlug {
  return typeof s === 'string' && (EXPERIENCE_PACK_SLUGS as readonly string[]).includes(s)
}

export function getExperiencePack(slug: string | null | undefined): ExperiencePack | null {
  if (!slug || slug === 'none') return null
  if (!(slug in EXPERIENCE_PACKS)) return null
  return EXPERIENCE_PACKS[slug as Exclude<ExperiencePackSlug, 'none'>]
}

const OCEAN_KEYS = /\b(ocean|marine|sea|aquatic|fish|coral|whale|nautical|diving|saltwater|tsunami|wave|beach|coast)\b/i
const FOREST_KEYS = /\b(forest|tree|woodland|jungle|rainforest|botany|plant|leaf|wildlife|hiking|nature|green|sustainab)\b/i
const SPACE_KEYS = /\b(space|orbit|planet|star|galaxy|cosmos|astronaut|rocket|nasa|astro|lunar|solar system|constellation)\b/i

/** Deterministic suggestion from course title and optional tags (used by Studio AI routes). */
export function suggestExperiencePackFromText(title: string, tags?: string[]): ExperiencePackSlug {
  const blob = [title, ...(tags ?? [])].join(' ').toLowerCase()
  if (OCEAN_KEYS.test(blob)) return 'ocean'
  if (FOREST_KEYS.test(blob)) return 'forest'
  if (SPACE_KEYS.test(blob)) return 'space'
  return 'none'
}

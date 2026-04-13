/** Shared theming for generated Sudar course thumbnail / banner art (no stock imagery). */

/** Curated Uiverse.io gallery picks (CSS adapted; see `docs/THIRD_PARTY_NOTICES.md`). */
export type CourseArtUivPickId =
  | 'uiv_breezy_turkey'
  | 'uiv_slimy_gecko'
  | 'uiv_mean_emu'
  | 'uiv_chilly_moth'
  | 'uiv_smart_lizard'
  | 'uiv_plastic_warthog'
  | 'uiv_clever_puma'
  | 'uiv_polite_earwig'
  | 'uiv_sweet_dolphin'
  | 'uiv_smart_termite'
  | 'uiv_wicked_fly'
  | 'uiv_short_newt'
  | 'uiv_moody_eel'
  | 'uiv_dull_mouse'

/** Built-in patterns + Uiverse-inspired CSS layers (see `docs/THIRD_PARTY_NOTICES.md`). */
export type CourseArtPattern =
  | 'grid'
  | 'mesh'
  | 'noise'
  | 'uiverse_stripes'
  | 'uiverse_rings'
  | 'uiverse_hatch'
  | 'uiverse_beams'
  | CourseArtUivPickId

export const COURSE_ART_UIV_PICK_IDS: readonly CourseArtUivPickId[] = [
  'uiv_breezy_turkey',
  'uiv_slimy_gecko',
  'uiv_mean_emu',
  'uiv_chilly_moth',
  'uiv_smart_lizard',
  'uiv_plastic_warthog',
  'uiv_clever_puma',
  'uiv_polite_earwig',
  'uiv_sweet_dolphin',
  'uiv_smart_termite',
  'uiv_wicked_fly',
  'uiv_short_newt',
  'uiv_moody_eel',
  'uiv_dull_mouse',
] as const

export const COURSE_ART_PATTERN_IDS: readonly CourseArtPattern[] = [
  'grid',
  'mesh',
  'noise',
  'uiverse_stripes',
  'uiverse_rings',
  'uiverse_hatch',
  'uiverse_beams',
  ...COURSE_ART_UIV_PICK_IDS,
] as const

/** Layer classes for `PatternLayer` (Tailwind + `globals.css` `.sudar-art-uiv-*`). */
export const COURSE_ART_UIV_PICK_LAYER: Record<
  CourseArtUivPickId,
  {
    base: string
    full: string
    glass: string
    subtle: string
    expressive: string
  }
> = {
  uiv_breezy_turkey: {
    base: 'sudar-art-uiv-breezy-turkey',
    full: 'opacity-[0.38]',
    glass: 'z-0 overflow-hidden rounded-xl mix-blend-soft-light opacity-[0.5]',
    subtle: 'motion-safe:sudar-art-uiv-breezy-turkey-m-subtle',
    expressive: 'motion-safe:sudar-art-uiv-breezy-turkey-m-expressive',
  },
  uiv_slimy_gecko: {
    base: 'sudar-art-uiv-slimy-gecko',
    full: 'opacity-[0.42]',
    glass: 'z-0 overflow-hidden rounded-xl mix-blend-overlay opacity-[0.52]',
    subtle: 'motion-safe:sudar-art-uiv-slimy-gecko-m-subtle',
    expressive: 'motion-safe:sudar-art-uiv-slimy-gecko-m-expressive',
  },
  uiv_mean_emu: {
    base: 'sudar-art-uiv-mean-emu',
    full: 'opacity-[0.4]',
    glass: 'z-0 overflow-hidden rounded-xl mix-blend-overlay opacity-[0.52]',
    subtle: 'motion-safe:sudar-art-uiv-mean-emu-m-subtle',
    expressive: 'motion-safe:sudar-art-uiv-mean-emu-m-expressive',
  },
  uiv_chilly_moth: {
    base: 'sudar-art-uiv-chilly-moth',
    full: 'opacity-[0.36]',
    glass: 'z-0 overflow-hidden rounded-xl mix-blend-overlay opacity-[0.48]',
    subtle: 'motion-safe:sudar-art-uiv-chilly-moth-m-subtle',
    expressive: 'motion-safe:sudar-art-uiv-chilly-moth-m-expressive',
  },
  uiv_smart_lizard: {
    base: 'sudar-art-uiv-smart-lizard',
    full: 'opacity-[0.34]',
    glass: 'z-0 overflow-hidden rounded-xl mix-blend-overlay opacity-[0.46]',
    subtle: 'motion-safe:sudar-art-uiv-smart-lizard-m-subtle',
    expressive: 'motion-safe:sudar-art-uiv-smart-lizard-m-expressive',
  },
  uiv_plastic_warthog: {
    base: 'sudar-art-uiv-plastic-warthog',
    full: 'opacity-[0.36] mix-blend-overlay',
    glass: 'z-0 overflow-hidden rounded-xl mix-blend-overlay opacity-[0.48]',
    subtle: 'motion-safe:sudar-art-uiv-plastic-warthog-m-subtle',
    expressive: 'motion-safe:sudar-art-uiv-plastic-warthog-m-expressive',
  },
  uiv_clever_puma: {
    base: 'sudar-art-uiv-clever-puma',
    full: 'opacity-[0.4]',
    glass: 'z-0 overflow-hidden rounded-xl mix-blend-soft-light opacity-[0.48]',
    subtle: 'motion-safe:sudar-art-uiv-clever-puma-m-subtle',
    expressive: 'motion-safe:sudar-art-uiv-clever-puma-m-expressive',
  },
  uiv_polite_earwig: {
    base: 'sudar-art-uiv-polite-earwig',
    full: 'opacity-[0.38]',
    glass: 'z-0 overflow-hidden rounded-xl mix-blend-overlay opacity-[0.5]',
    subtle: 'motion-safe:sudar-art-uiv-polite-earwig-m-subtle',
    expressive: 'motion-safe:sudar-art-uiv-polite-earwig-m-expressive',
  },
  uiv_sweet_dolphin: {
    base: 'sudar-art-uiv-sweet-dolphin',
    full: 'opacity-[0.38]',
    glass: 'z-0 overflow-hidden rounded-xl mix-blend-soft-light opacity-[0.5]',
    subtle: 'motion-safe:sudar-art-uiv-sweet-dolphin-m-subtle',
    expressive: 'motion-safe:sudar-art-uiv-sweet-dolphin-m-expressive',
  },
  uiv_smart_termite: {
    base: 'sudar-art-uiv-smart-termite',
    full: 'opacity-[0.34]',
    glass: 'z-0 overflow-hidden rounded-xl mix-blend-overlay opacity-[0.46]',
    subtle: 'motion-safe:sudar-art-uiv-smart-termite-m-subtle',
    expressive: 'motion-safe:sudar-art-uiv-smart-termite-m-expressive',
  },
  uiv_wicked_fly: {
    base: 'sudar-art-uiv-wicked-fly',
    full: 'opacity-[0.36]',
    glass: 'z-0 overflow-hidden rounded-xl mix-blend-overlay opacity-[0.48]',
    subtle: 'motion-safe:sudar-art-uiv-wicked-fly-m-subtle',
    expressive: 'motion-safe:sudar-art-uiv-wicked-fly-m-expressive',
  },
  uiv_short_newt: {
    base: 'sudar-art-uiv-short-newt',
    full: 'opacity-[0.36]',
    glass: 'z-0 overflow-hidden rounded-xl mix-blend-soft-light opacity-[0.48]',
    subtle: 'motion-safe:sudar-art-uiv-short-newt-m-subtle',
    expressive: 'motion-safe:sudar-art-uiv-short-newt-m-expressive',
  },
  uiv_moody_eel: {
    base: 'sudar-art-uiv-moody-eel',
    full: 'opacity-[0.38]',
    glass: 'z-0 overflow-hidden rounded-xl mix-blend-overlay opacity-[0.5]',
    subtle: 'motion-safe:sudar-art-uiv-moody-eel-m-subtle',
    expressive: 'motion-safe:sudar-art-uiv-moody-eel-m-expressive',
  },
  uiv_dull_mouse: {
    base: 'sudar-art-uiv-dull-mouse',
    full: 'opacity-[0.32]',
    glass: 'z-0 overflow-hidden rounded-xl mix-blend-overlay opacity-[0.44]',
    subtle: 'motion-safe:sudar-art-uiv-dull-mouse-m-subtle',
    expressive: 'motion-safe:sudar-art-uiv-dull-mouse-m-expressive',
  },
}

export function isCourseArtUivPickId(value: string): value is CourseArtUivPickId {
  return (COURSE_ART_UIV_PICK_IDS as readonly string[]).includes(value)
}

export function isCourseArtPattern(value: string): value is CourseArtPattern {
  return (COURSE_ART_PATTERN_IDS as readonly string[]).includes(value)
}

/** Human-readable labels for pattern picker UI (Learn + Studio). */
export const COURSE_ART_PATTERN_LABELS = {
  grid: 'Dot grid',
  mesh: 'Soft mesh',
  noise: 'Film grain',
  uiverse_stripes: 'Diagonal stripes',
  uiverse_rings: 'Concentric rings',
  uiverse_hatch: 'Crosshatch',
  uiverse_beams: 'Light beams',
  uiv_breezy_turkey: 'Breezy turkey',
  uiv_slimy_gecko: 'Slimy gecko',
  uiv_mean_emu: 'Mean emu (polka)',
  uiv_chilly_moth: 'Chilly moth',
  uiv_smart_lizard: 'Smart lizard',
  uiv_plastic_warthog: 'Plastic warthog',
  uiv_clever_puma: 'Clever puma',
  uiv_polite_earwig: 'Polite earwig (rings)',
  uiv_sweet_dolphin: 'Sweet dolphin',
  uiv_smart_termite: 'Smart termite',
  uiv_wicked_fly: 'Wicked fly',
  uiv_short_newt: 'Short newt',
  uiv_moody_eel: 'Moody eel',
  uiv_dull_mouse: 'Dull mouse',
} as const satisfies Record<CourseArtPattern, string>

export const COURSE_ART_PATTERN_OPTION_GROUPS: readonly {
  readonly group: string
  readonly options: readonly { readonly value: CourseArtPattern; readonly label: string }[]
}[] = [
  {
    group: 'Core textures',
    options: (['grid', 'mesh', 'noise'] as const).map((value) => ({
      value,
      label: COURSE_ART_PATTERN_LABELS[value],
    })),
  },
  {
    group: 'Layered styles',
    options: (['uiverse_stripes', 'uiverse_rings', 'uiverse_hatch', 'uiverse_beams'] as const).map((value) => ({
      value,
      label: COURSE_ART_PATTERN_LABELS[value],
    })),
  },
  {
    group: 'Gallery picks',
    options: COURSE_ART_UIV_PICK_IDS.map((value) => ({
      value,
      label: COURSE_ART_PATTERN_LABELS[value],
    })),
  },
]

export type CourseArtMotion = 'subtle' | 'expressive'

/** Indices map to `.sudar-art-palette-{n}` in `globals.css` (Tailwind-safe, no inline styles). */
export const COURSE_ART_PALETTE_COUNT = 8

const DIFF_MOD = {
  beginner: { orbClass: 'sudar-art-orb-diff-beginner', pill: 'bg-emerald-500/25 text-emerald-100 border-emerald-400/35' },
  intermediate: { orbClass: 'sudar-art-orb-diff-intermediate', pill: 'bg-amber-500/25 text-amber-50 border-amber-400/35' },
  advanced: { orbClass: 'sudar-art-orb-diff-advanced', pill: 'bg-rose-500/25 text-rose-50 border-rose-400/35' },
  default: { orbClass: 'sudar-art-orb-diff-default', pill: 'bg-white/15 text-white border-white/25' },
} as const

export function hashString(s: string): number {
  let h = 0
  for (let i = 0; i < s.length; i++) h = (Math.imul(31, h) + s.charCodeAt(i)) | 0
  return Math.abs(h)
}

export function resolveCourseArtTheme(courseId: string, difficulty: string | null) {
  const h = hashString(courseId)
  const paletteIndex = h % COURSE_ART_PALETTE_COUNT
  const diffKey =
    difficulty === 'beginner' || difficulty === 'intermediate' || difficulty === 'advanced'
      ? difficulty
      : 'default'
  const diff = DIFF_MOD[diffKey]
  return {
    paletteClass: `sudar-art-palette-${paletteIndex}`,
    orbDiffClass: diff.orbClass,
    difficultyPillClass: diff.pill,
    paletteIndex,
  }
}

export function formatDurationShort(mins: number | null): string | null {
  if (mins == null || mins < 0) return null
  if (mins >= 60) {
    const h = Math.floor(mins / 60)
    const m = mins % 60
    return m > 0 ? `${h}h ${m}m` : `${h}h`
  }
  return `${mins}m`
}

export function difficultyLabel(difficulty: string | null): string | null {
  if (!difficulty) return null
  if (difficulty === 'beginner') return 'Beginner'
  if (difficulty === 'intermediate') return 'Intermediate'
  if (difficulty === 'advanced') return 'Advanced'
  return difficulty.charAt(0).toUpperCase() + difficulty.slice(1)
}

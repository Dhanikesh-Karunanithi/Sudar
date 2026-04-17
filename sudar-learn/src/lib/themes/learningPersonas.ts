/**
 * Sudar Learn — Learning Personas (Style Engine).
 * Mirrors Studio config for CourseThemeProvider; adapted for sustained reading.
 */

export const LEARNING_PERSONA_SLUGS = ['precision', 'editorial', 'authority', 'devcore', 'verdant'] as const
export type LearningPersonaSlug = (typeof LEARNING_PERSONA_SLUGS)[number]

export type QuizCardStyle = 'flat' | 'elevated' | 'outlined'

/** Force light or dark so the persona always has readable contrast. */
export type PreferredColorScheme = 'light' | 'dark'

export interface LearningPersona {
  slug: LearningPersonaSlug
  label: string
  description: string
  bestFor: string[]
  /** Ensures this persona is always readable; we apply this scheme in the content area. */
  preferredColorScheme: PreferredColorScheme
  fontDisplay: string
  fontBody: string
  fontMono: string
  fontUrl?: string
  colorBackground: string
  colorForeground: string
  colorAccent: string
  colorAccent2: string
  /** Muted text / secondary (must contrast with colorForeground on colorBackground). */
  colorMuted?: string
  borderRadius: string
  borderStyle: string
  borderColor: string
  sideNoteAccent: string
  quizCardStyle: QuizCardStyle
}

export const LEARNING_PERSONAS: Record<LearningPersonaSlug, LearningPersona> = {
  precision: {
    slug: 'precision',
    label: 'Precision',
    description: 'Minimalist monochrome, hairline borders, technical clarity.',
    bestFor: ['Engineering', 'Systems design', 'Technical courses'],
    preferredColorScheme: 'dark',
    fontDisplay: '"Inter Tight", system-ui, sans-serif',
    fontBody: '"Inter", system-ui, sans-serif',
    fontMono: '"JetBrains Mono", "Fira Code", monospace',
    fontUrl: 'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Inter+Tight:wght@400;600;700;900&family=JetBrains+Mono:wght@400;500&display=swap',
    colorBackground: '#0a0a0a',
    colorForeground: '#f4f4f5',
    colorMuted: '#a1a1aa',
    colorAccent: '#6366f1',
    colorAccent2: '#818cf8',
    borderRadius: '0px',
    borderStyle: '1px solid',
    borderColor: 'rgba(255,255,255,0.12)',
    sideNoteAccent: '#6366f1',
    quizCardStyle: 'outlined',
  },
  editorial: {
    slug: 'editorial',
    label: 'Editorial',
    description: 'Bold headlines, yellow accent, high-energy.',
    bestFor: ['Marketing', 'Entrepreneurship', 'Sales'],
    preferredColorScheme: 'dark',
    fontDisplay: '"Anton", system-ui, sans-serif',
    fontBody: '"Inter", system-ui, sans-serif',
    fontMono: '"JetBrains Mono", monospace',
    fontUrl: 'https://fonts.googleapis.com/css2?family=Anton&family=Inter:wght@400;500;600;700&display=swap',
    colorBackground: '#0c0f0d',
    colorForeground: '#f4f4f5',
    colorMuted: '#b7c6c2',
    colorAccent: '#ffe17c',
    colorAccent2: '#171e19',
    borderRadius: '12px',
    borderStyle: '1px solid',
    borderColor: 'rgba(255,225,124,0.2)',
    sideNoteAccent: '#ffe17c',
    quizCardStyle: 'elevated',
  },
  authority: {
    slug: 'authority',
    label: 'Authority',
    description: 'Serif display, deep red accent, classic proportions.',
    bestFor: ['Finance', 'Consulting', 'Leadership'],
    preferredColorScheme: 'dark',
    fontDisplay: '"Playfair Display", Georgia, serif',
    fontBody: '"Inter", system-ui, sans-serif',
    fontMono: '"JetBrains Mono", monospace',
    fontUrl: 'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600&family=Playfair+Display:ital,wght@0,400;0,600;0,700&display=swap',
    colorBackground: '#0c0a0a',
    colorForeground: '#fafafa',
    colorMuted: '#a8a29e',
    colorAccent: '#e11d48',
    colorAccent2: '#b91c1c',
    borderRadius: '8px',
    borderStyle: '1px solid',
    borderColor: 'rgba(255,255,255,0.12)',
    sideNoteAccent: '#e11d48',
    quizCardStyle: 'outlined',
  },
  devcore: {
    slug: 'devcore',
    label: 'DevCore',
    description: 'Monospace-first, cyan accent, dark terminal feel.',
    bestFor: ['Developer tools', 'APIs', 'Documentation'],
    preferredColorScheme: 'dark',
    fontDisplay: '"JetBrains Mono", "Fira Code", monospace',
    fontBody: '"JetBrains Mono", "Fira Code", monospace',
    fontMono: '"JetBrains Mono", "Fira Code", monospace',
    fontUrl: 'https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600&display=swap',
    colorBackground: '#0c1222',
    colorForeground: '#e2e8f0',
    colorMuted: '#94a3b8',
    colorAccent: '#22d3ee',
    colorAccent2: '#06b6d4',
    borderRadius: '6px',
    borderStyle: '1px solid',
    borderColor: 'rgba(34,211,238,0.25)',
    sideNoteAccent: '#22d3ee',
    quizCardStyle: 'flat',
  },
  verdant: {
    slug: 'verdant',
    label: 'Verdant',
    description: 'Green and gold, organic spacing, soft radius.',
    bestFor: ['Design', 'Wellness', 'Sustainability'],
    preferredColorScheme: 'light',
    fontDisplay: '"Playfair Display", Georgia, serif',
    fontBody: '"Inter", system-ui, sans-serif',
    fontMono: '"JetBrains Mono", monospace',
    fontUrl: 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=Playfair+Display:wght@400;600;700&display=swap',
    colorBackground: '#f8faf8',
    colorForeground: '#0f1411',
    colorMuted: '#52796f',
    colorAccent: '#00ab8e',
    colorAccent2: '#d4a017',
    borderRadius: '16px',
    borderStyle: '1px solid',
    borderColor: 'rgba(0,171,142,0.25)',
    sideNoteAccent: '#00ab8e',
    quizCardStyle: 'elevated',
  },
}

export function getLearningPersona(slug: string | null | undefined): LearningPersona | null {
  if (!slug || !LEARNING_PERSONA_SLUGS.includes(slug as LearningPersonaSlug)) return null
  return LEARNING_PERSONAS[slug as LearningPersonaSlug]
}

import type { MascotId, MascotPersona, MascotPreferences } from '@/types/mascot'

/** Approved Sudar logo (SVG); PNG variants: `/sudar-logo.png`, `/sudar-logo-dark.png`, `/sudar-logo-light.png`. */
export const SUDAR_LOGO_AVATAR_SRC = '/sudar-logo.svg'

export const DEFAULT_MASCOT_PREFERENCES: MascotPreferences = {
  mascot_mode: 'all',
  mascot_style: 'balanced',
  mascot_intensity: 'high',
  mascot_companions: ['focus', 'memory', 'confidence'],
}

export const MASCOT_PERSONAS: Record<MascotId, MascotPersona> = {
  sudar: {
    id: 'sudar',
    name: 'Sudar',
    domain: 'hero',
    colorToken: 'text-primary',
    icon: 'sparkles',
    avatarSrc: SUDAR_LOGO_AVATAR_SRC,
    summary: 'Always-on guide that helps learners stay oriented and encouraged.',
  },
  focus: {
    id: 'focus',
    name: 'Focus',
    domain: 'focus',
    colorToken: 'text-sky-500',
    icon: 'target',
    avatarSrc: SUDAR_LOGO_AVATAR_SRC,
    summary: 'Momentum coach for starting and sustaining attention.',
  },
  memory: {
    id: 'memory',
    name: 'Memory',
    domain: 'memory',
    colorToken: 'text-violet-500',
    icon: 'brain',
    avatarSrc: SUDAR_LOGO_AVATAR_SRC,
    summary: 'Retrieval practice specialist for recap and reinforcement.',
  },
  confidence: {
    id: 'confidence',
    name: 'Confidence',
    domain: 'confidence',
    colorToken: 'text-emerald-500',
    icon: 'heart',
    avatarSrc: SUDAR_LOGO_AVATAR_SRC,
    summary: 'Supportive companion for setbacks, retries, and self-belief.',
  },
}

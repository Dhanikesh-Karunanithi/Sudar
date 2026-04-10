import type { MascotId, MascotPersona, MascotPreferences } from '@/types/mascot'

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
    avatarSrc: '/mascots/sudar-neutral.svg',
    summary: 'Always-on guide that helps learners stay oriented and encouraged.',
  },
  focus: {
    id: 'focus',
    name: 'Focus',
    domain: 'focus',
    colorToken: 'text-sky-500',
    icon: 'target',
    avatarSrc: '/mascots/focus-neutral.svg',
    summary: 'Momentum coach for starting and sustaining attention.',
  },
  memory: {
    id: 'memory',
    name: 'Memory',
    domain: 'memory',
    colorToken: 'text-violet-500',
    icon: 'brain',
    avatarSrc: '/mascots/memory-neutral.svg',
    summary: 'Retrieval practice specialist for recap and reinforcement.',
  },
  confidence: {
    id: 'confidence',
    name: 'Confidence',
    domain: 'confidence',
    colorToken: 'text-emerald-500',
    icon: 'heart',
    avatarSrc: '/mascots/confidence-neutral.svg',
    summary: 'Supportive companion for setbacks, retries, and self-belief.',
  },
}

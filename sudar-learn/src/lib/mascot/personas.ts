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
    summary: 'Warm fire spirit guide who lights the next step with calm, kind, and concise support.',
  },
  focus: {
    id: 'focus',
    name: 'Focus',
    domain: 'focus',
    colorToken: 'text-sky-500',
    icon: 'target',
    summary: 'Momentum coach for starting and sustaining attention.',
  },
  memory: {
    id: 'memory',
    name: 'Memory',
    domain: 'memory',
    colorToken: 'text-violet-500',
    icon: 'brain',
    summary: 'Retrieval practice specialist for recap and reinforcement.',
  },
  confidence: {
    id: 'confidence',
    name: 'Confidence',
    domain: 'confidence',
    colorToken: 'text-emerald-500',
    icon: 'heart',
    summary: 'Supportive companion for setbacks, retries, and self-belief.',
  },
}

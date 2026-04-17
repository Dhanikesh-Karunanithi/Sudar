import { DEFAULT_MASCOT_PREFERENCES } from '@/lib/mascot/personas'
import type { MascotId, MascotPreferences, MascotResponse, MascotTrigger } from '@/types/mascot'

const SUPPORT_STYLE_OPENERS: Record<MascotPreferences['mascot_style'], string> = {
  calm: 'You are doing well. ',
  balanced: '',
  energetic: 'Great momentum. ',
}

const TRIGGER_MAP: Record<MascotTrigger, MascotId> = {
  dashboard_view: 'sudar',
  chat_open: 'sudar',
  chat_query: 'focus',
  module_complete: 'memory',
  retry_after_error: 'confidence',
  session_resume: 'focus',
}

function getAllowedMascots(preferences: MascotPreferences): MascotId[] {
  if (preferences.mascot_mode === 'hero-only') return ['sudar']
  if (preferences.mascot_mode === 'selected') {
    const selected = preferences.mascot_companions.filter((id) => id !== 'sudar')
    return ['sudar', ...selected]
  }
  return ['sudar', 'focus', 'memory', 'confidence']
}

export function normalizeMascotPreferences(input?: Partial<MascotPreferences> | null): MascotPreferences {
  if (!input) return DEFAULT_MASCOT_PREFERENCES
  return {
    mascot_mode: input.mascot_mode ?? DEFAULT_MASCOT_PREFERENCES.mascot_mode,
    mascot_style: input.mascot_style ?? DEFAULT_MASCOT_PREFERENCES.mascot_style,
    mascot_intensity: input.mascot_intensity ?? DEFAULT_MASCOT_PREFERENCES.mascot_intensity,
    mascot_companions: input.mascot_companions?.length ? input.mascot_companions : DEFAULT_MASCOT_PREFERENCES.mascot_companions,
  }
}

export function pickActiveMascot(trigger: MascotTrigger, preferencesInput?: Partial<MascotPreferences> | null): MascotId {
  const preferences = normalizeMascotPreferences(preferencesInput)
  const preferred = TRIGGER_MAP[trigger]
  const allowed = getAllowedMascots(preferences)
  return allowed.includes(preferred) ? preferred : 'sudar'
}

export function buildMascotResponse(trigger: MascotTrigger, preferencesInput?: Partial<MascotPreferences> | null): MascotResponse {
  const preferences = normalizeMascotPreferences(preferencesInput)
  const mascotId = pickActiveMascot(trigger, preferences)
  const opener = SUPPORT_STYLE_OPENERS[preferences.mascot_style]

  if (mascotId === 'focus') {
    return {
      mascotId,
      emotion: 'focused',
      text: `${opener}Start with one small step and build from there.`,
    }
  }
  if (mascotId === 'memory') {
    return {
      mascotId,
      emotion: 'prompting',
      text: `${opener}Quick recap: what is the one key idea you want to keep?`,
    }
  }
  if (mascotId === 'confidence') {
    return {
      mascotId,
      emotion: 'supportive',
      text: `${opener}Struggle is a useful signal. Let us break this into one easier step.`,
    }
  }
  return {
    mascotId: 'sudar',
    emotion: trigger === 'dashboard_view' ? 'guiding' : 'supportive',
    text: `${opener}I am here with you. Ask anything and we will learn through it together.`,
  }
}

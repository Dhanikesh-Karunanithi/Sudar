export type MascotId = 'sudar' | 'focus' | 'memory' | 'confidence'

export type MascotMode = 'all' | 'selected' | 'hero-only'

export type MascotSupportStyle = 'calm' | 'balanced' | 'energetic'

export type MascotIntensity = 'low' | 'medium' | 'high'

export type MascotEmotion =
  | 'neutral'
  | 'guiding'
  | 'supportive'
  | 'celebratory'
  | 'concern'
  | 'focused'
  | 'prompting'
  | 'stabilizing'

export type MascotTrigger =
  | 'dashboard_view'
  | 'chat_open'
  | 'chat_query'
  | 'module_complete'
  | 'retry_after_error'
  | 'session_resume'

export type MascotEventType =
  | 'mascot_impression'
  | 'mascot_interaction'
  | 'mascot_dismiss'
  | 'mascot_mode_change'
  | 'mascot_nudge_outcome'

export interface MascotPreferences {
  mascot_mode: MascotMode
  mascot_style: MascotSupportStyle
  mascot_intensity: MascotIntensity
  mascot_companions: MascotId[]
}

export interface MascotPersona {
  id: MascotId
  name: string
  domain: 'hero' | 'focus' | 'memory' | 'confidence'
  colorToken: string
  icon: 'sparkles' | 'target' | 'brain' | 'heart'
  /** Public path under byteos-learn/public (`/sudar-logo.svg` or PNG variants). */
  avatarSrc: string
  summary: string
}

export interface MascotResponse {
  mascotId: MascotId
  emotion: MascotEmotion
  text: string
}

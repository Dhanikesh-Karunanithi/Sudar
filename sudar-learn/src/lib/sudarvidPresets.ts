import { getSudarVidDefaultEngineMode } from '@/lib/sudarvid'
import type { SudarVidEngineMode } from '@/lib/sudarvidContracts'

/** Learner-facing Watch generation presets → SudarVid POST /generate fields. */
export type SudarVidVideoPreset = 'standard' | 'rich' | 'standard_mp4' | 'rich_mp4'

const PRESET_KEYS = new Set<string>(['standard', 'rich', 'standard_mp4', 'rich_mp4'])

export function normalizeVideoPreset(value: unknown): SudarVidVideoPreset {
  const s = typeof value === 'string' ? value.trim().toLowerCase() : ''
  if (PRESET_KEYS.has(s)) return s as SudarVidVideoPreset
  return 'standard'
}

export function presetToEngineMode(preset: SudarVidVideoPreset): SudarVidEngineMode {
  return preset === 'rich' || preset === 'rich_mp4' ? 'premium' : 'classic'
}

export function presetIncludesMp4(preset: SudarVidVideoPreset): boolean {
  return preset === 'standard_mp4' || preset === 'rich_mp4'
}

export interface SudarVidGeneratePresetFields {
  engine_mode: SudarVidEngineMode
  theme: string
  slide_count: number
  video_size: { width: number; height: number }
  animation_level: string
  include_tts: boolean
  include_music: boolean
  output_html: boolean
  output_mp4: boolean
}

/** Base fields shared by all presets; engine + mp4 vary. */
export function getSudarVidPresetBaseFields(): Omit<SudarVidGeneratePresetFields, 'engine_mode' | 'output_mp4'> {
  return {
    theme: 'seminar_minimal',
    slide_count: 6,
    video_size: { width: 1920, height: 1080 },
    animation_level: 'medium',
    include_tts: true,
    include_music: false,
    output_html: true,
  }
}

export function buildGenerateFieldsForPreset(preset: SudarVidVideoPreset): SudarVidGeneratePresetFields {
  const base = getSudarVidPresetBaseFields()
  return {
    ...base,
    engine_mode: presetToEngineMode(preset),
    output_mp4: presetIncludesMp4(preset),
  }
}

/** Default preset when the client has not chosen one (matches `SUDARVID_ENGINE_MODE`). */
export function getDefaultVideoPresetFromEnv(): SudarVidVideoPreset {
  return getSudarVidDefaultEngineMode() === 'premium' ? 'rich' : 'standard'
}

/** After HTTP fallback from premium to classic, align preset label with what SudarVid ran. */
export function downgradePremiumPresetToStandard(preset: SudarVidVideoPreset): SudarVidVideoPreset {
  if (preset === 'rich_mp4') return 'standard_mp4'
  if (preset === 'rich') return 'standard'
  return preset
}

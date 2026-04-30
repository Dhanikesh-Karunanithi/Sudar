export type SudarVidEngineMode = 'classic' | 'premium'

export type SudarVidInteractionType = 'none' | 'reflect' | 'decision' | 'checkpoint'

export interface SudarVidGenerateMeta {
  engine_mode?: string
  theme?: string
  animation_level?: string
  include_tts?: boolean
  include_music?: boolean
  output_html?: boolean
  output_mp4?: boolean
}

export interface SudarVidStatusPayload {
  job_id?: string
  status?: string
  output_files?: string[]
  error?: string | null
  meta?: SudarVidGenerateMeta
}

export interface SudarVidSlideManifestEntry {
  scene_number?: number
  title?: string
  interaction_type?: string | null
}

export function normalizeEngineMode(value: unknown): SudarVidEngineMode {
  return value === 'premium' ? 'premium' : 'classic'
}

export function normalizeInteractionType(value: unknown): SudarVidInteractionType {
  if (value === 'reflect' || value === 'decision' || value === 'checkpoint') return value
  return 'none'
}

export function parseGenerateMeta(meta: unknown): SudarVidGenerateMeta {
  if (!meta || typeof meta !== 'object') return {}
  return meta as SudarVidGenerateMeta
}

export function summarizeManifestInteractions(
  rows: unknown,
): { total_slides: number; interaction_counts: Record<SudarVidInteractionType, number> } {
  const counts: Record<SudarVidInteractionType, number> = {
    none: 0,
    reflect: 0,
    decision: 0,
    checkpoint: 0,
  }
  if (!Array.isArray(rows)) return { total_slides: 0, interaction_counts: counts }
  for (const row of rows) {
    const item = (row && typeof row === 'object') ? row as SudarVidSlideManifestEntry : null
    const interactionType = normalizeInteractionType(item?.interaction_type)
    counts[interactionType] += 1
  }
  return { total_slides: rows.length, interaction_counts: counts }
}

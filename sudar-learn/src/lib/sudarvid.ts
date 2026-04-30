const FALLBACK_SUDARVID_URL = 'http://localhost:8000'
const DEFAULT_ENGINE_MODE = 'classic'

export function getSudarVidBaseUrl(): string {
  const configuredUrl = process.env.SUDARVID_URL ?? FALLBACK_SUDARVID_URL

  return configuredUrl.replace(/\/$/, '')
}

export function isSudarVidConfigured(): boolean {
  return Boolean(process.env.SUDARVID_URL)
}

export function getSudarVidDefaultEngineMode(): 'classic' | 'premium' {
  return process.env.SUDARVID_ENGINE_MODE === 'premium' ? 'premium' : DEFAULT_ENGINE_MODE
}

/**
 * Hybrid integration fallback switch:
 * - false (default): strict HTTP contract mode only.
 * - true: if requested mode fails at generate start, retry once with classic.
 */
export function isSudarVidGenerateFallbackEnabled(): boolean {
  return process.env.SUDARVID_HTTP_FALLBACK_ENABLED === 'true'
}

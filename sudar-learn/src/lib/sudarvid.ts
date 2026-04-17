const FALLBACK_SUDARVID_URL = 'http://localhost:8000'

export function getSudarVidBaseUrl(): string {
  const configuredUrl = process.env.SUDARVID_URL ?? FALLBACK_SUDARVID_URL

  return configuredUrl.replace(/\/$/, '')
}

export function isSudarVidConfigured(): boolean {
  return Boolean(process.env.SUDARVID_URL)
}

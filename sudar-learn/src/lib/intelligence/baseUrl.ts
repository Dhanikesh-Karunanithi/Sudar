export function sudarIntelligenceBaseUrl(): string | null {
  const raw = process.env.SUDAR_INTELLIGENCE_URL ?? process.env.BYTEOS_INTELLIGENCE_URL
  const trimmed = typeof raw === 'string' ? raw.trim() : ''
  if (!trimmed) return null
  return trimmed.replace(/\/$/, '')
}

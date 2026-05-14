/**
 * Map learner `content_language` (app locale) to Sarvam `target_language_code` when using sarvam_* voices.
 * Falls back to en-IN when unknown.
 */
export function sarvamTargetLanguageFromContentLocale(locale: string | null | undefined): string {
  if (!locale) return 'en-IN'
  const l = locale.toLowerCase()
  if (l === 'hi' || l.startsWith('hi-')) return 'hi-IN'
  if (l === 'ta' || l.startsWith('ta-')) return 'ta-IN'
  if (l === 'te' || l.startsWith('te-')) return 'te-IN'
  if (l === 'kn' || l.startsWith('kn-')) return 'kn-IN'
  if (l === 'mr' || l.startsWith('mr-')) return 'mr-IN'
  if (l === 'bn' || l.startsWith('bn-')) return 'bn-IN'
  if (l === 'gu' || l.startsWith('gu-')) return 'gu-IN'
  if (l === 'pa' || l.startsWith('pa-')) return 'pa-IN'
  if (l === 'ml' || l.startsWith('ml-')) return 'ml-IN'
  return 'en-IN'
}

import type { AppLocale } from '../../../../shared/i18nLocales'

/**
 * Default Edge-TTS voice when the learner has not picked a voice yet.
 * Maps app locale / content-language codes to a reasonable neural voice.
 */
export const DEFAULT_VOICE_BY_CONTENT_LOCALE: Partial<Record<AppLocale, string>> = {
  en: 'en-US-JennyNeural',
  es: 'es-ES-ElviraNeural',
  fr: 'fr-FR-DeniseNeural',
  ar: 'ar-SA-ZariyahNeural',
  hi: 'hi-IN-SwaraNeural',
  'zh-CN': 'zh-CN-XiaoxiaoNeural',
  'zh-TW': 'zh-TW-HsiaoChenNeural',
  de: 'de-DE-KatjaNeural',
  pt: 'pt-BR-FranciscaNeural',
  ru: 'ru-RU-SvetlanaNeural',
  ja: 'ja-JP-NanamiNeural',
  ko: 'ko-KR-SunHiNeural',
  tr: 'tr-TR-EmelNeural',
  id: 'id-ID-GadisNeural',
  vi: 'vi-VN-HoaiMyNeural',
  pl: 'pl-PL-AgnieszkaNeural',
  it: 'it-IT-ElsaNeural',
  nl: 'nl-NL-FennaNeural',
  bn: 'bn-BD-NabanitaNeural',
  ta: 'ta-IN-PallaviNeural',
  te: 'te-IN-ShrutiNeural',
  ur: 'ur-PK-UzmaNeural',
  fa: 'fa-IR-DilaraNeural',
  he: 'he-IL-HilaNeural',
  sw: 'sw-KE-ZuriNeural',
  uk: 'uk-UA-PolinaNeural',
  ms: 'ms-MY-YasminNeural',
  th: 'th-TH-PremwadeeNeural',
  gu: 'gu-IN-DhwaniNeural',
  pa: 'pa-IN-VaaniNeural',
  ne: 'ne-NP-HemkalaNeural',
  mr: 'mr-IN-AarohiNeural',
  sa: 'hi-IN-SwaraNeural',
  kn: 'kn-IN-SapnaNeural',
}

export function defaultVoiceIdForContentLocale(locale: string | null | undefined): string | null {
  if (!locale) return null
  const id = DEFAULT_VOICE_BY_CONTENT_LOCALE[locale as AppLocale]
  return id ?? null
}

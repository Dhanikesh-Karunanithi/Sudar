/**
 * Shared Sudar UI locale catalog (Learn + Studio).
 * BCP-47 style codes; filenames use the same string (e.g. zh-CN.json).
 */
export const APP_LOCALES = [
  'en',
  'es',
  'fr',
  'ar',
  'hi',
  'zh-CN',
  'zh-TW',
  'de',
  'pt',
  'ru',
  'ja',
  'ko',
  'tr',
  'id',
  'vi',
  'pl',
  'it',
  'nl',
  'bn',
  'ta',
  'te',
  'ur',
  'fa',
  'he',
  'sw',
  'uk',
  'ms',
  'th',
  'gu',
  'pa',
  'ne',
  'mr',
  'sa',
  'kn',
] as const

export type AppLocale = (typeof APP_LOCALES)[number]

export const DEFAULT_APP_LOCALE: AppLocale = 'en'

export const RTL_APP_LOCALES: readonly AppLocale[] = ['ar', 'ur', 'fa', 'he']

export function isRtlLocale(locale: string): boolean {
  return RTL_APP_LOCALES.includes(locale as AppLocale)
}

export type LocaleOption = {
  code: AppLocale
  /** English label */
  labelEn: string
  /** Native endonym */
  labelNative: string
  flag: string
}

export const LOCALE_OPTIONS: readonly LocaleOption[] = [
  { code: 'en', labelEn: 'English', labelNative: 'English', flag: '🇬🇧' },
  { code: 'es', labelEn: 'Spanish', labelNative: 'Español', flag: '🇪🇸' },
  { code: 'fr', labelEn: 'French', labelNative: 'Français', flag: '🇫🇷' },
  { code: 'ar', labelEn: 'Arabic', labelNative: 'العربية', flag: '🇸🇦' },
  { code: 'hi', labelEn: 'Hindi', labelNative: 'हिन्दी', flag: '🇮🇳' },
  { code: 'zh-CN', labelEn: 'Chinese (Simplified)', labelNative: '简体中文', flag: '🇨🇳' },
  { code: 'zh-TW', labelEn: 'Chinese (Traditional)', labelNative: '繁體中文', flag: '🇹🇼' },
  { code: 'de', labelEn: 'German', labelNative: 'Deutsch', flag: '🇩🇪' },
  { code: 'pt', labelEn: 'Portuguese', labelNative: 'Português', flag: '🇧🇷' },
  { code: 'ru', labelEn: 'Russian', labelNative: 'Русский', flag: '🇷🇺' },
  { code: 'ja', labelEn: 'Japanese', labelNative: '日本語', flag: '🇯🇵' },
  { code: 'ko', labelEn: 'Korean', labelNative: '한국어', flag: '🇰🇷' },
  { code: 'tr', labelEn: 'Turkish', labelNative: 'Türkçe', flag: '🇹🇷' },
  { code: 'id', labelEn: 'Indonesian', labelNative: 'Bahasa Indonesia', flag: '🇮🇩' },
  { code: 'vi', labelEn: 'Vietnamese', labelNative: 'Tiếng Việt', flag: '🇻🇳' },
  { code: 'pl', labelEn: 'Polish', labelNative: 'Polski', flag: '🇵🇱' },
  { code: 'it', labelEn: 'Italian', labelNative: 'Italiano', flag: '🇮🇹' },
  { code: 'nl', labelEn: 'Dutch', labelNative: 'Nederlands', flag: '🇳🇱' },
  { code: 'bn', labelEn: 'Bengali', labelNative: 'বাংলা', flag: '🇧🇩' },
  { code: 'ta', labelEn: 'Tamil', labelNative: 'தமிழ்', flag: '🇮🇳' },
  { code: 'te', labelEn: 'Telugu', labelNative: 'తెలుగు', flag: '🇮🇳' },
  { code: 'ur', labelEn: 'Urdu', labelNative: 'اردو', flag: '🇵🇰' },
  { code: 'fa', labelEn: 'Persian', labelNative: 'فارسی', flag: '🇮🇷' },
  { code: 'he', labelEn: 'Hebrew', labelNative: 'עברית', flag: '🇮🇱' },
  { code: 'sw', labelEn: 'Swahili', labelNative: 'Kiswahili', flag: '🇰🇪' },
  { code: 'uk', labelEn: 'Ukrainian', labelNative: 'Українська', flag: '🇺🇦' },
  { code: 'ms', labelEn: 'Malay', labelNative: 'Bahasa Melayu', flag: '🇲🇾' },
  { code: 'th', labelEn: 'Thai', labelNative: 'ไทย', flag: '🇹🇭' },
  { code: 'gu', labelEn: 'Gujarati', labelNative: 'ગુજરાતી', flag: '🇮🇳' },
  { code: 'pa', labelEn: 'Punjabi', labelNative: 'ਪੰਜਾਬੀ', flag: '🇮🇳' },
  { code: 'ne', labelEn: 'Nepali', labelNative: 'नेपाली', flag: '🇳🇵' },
  { code: 'mr', labelEn: 'Marathi', labelNative: 'मराठी', flag: '🇮🇳' },
  { code: 'sa', labelEn: 'Sanskrit', labelNative: 'संस्कृतम्', flag: '🇮🇳' },
  { code: 'kn', labelEn: 'Kannada', labelNative: 'ಕನ್ನಡ', flag: '🇮🇳' },
] as const

export function isAppLocale(code: string): code is AppLocale {
  return (APP_LOCALES as readonly string[]).includes(code)
}

export function clampAppLocale(code: string | null | undefined): AppLocale {
  if (code && isAppLocale(code)) return code
  return DEFAULT_APP_LOCALE
}

import type { AppLocale } from '@/i18n/routing'

/**
 * Tailwind font family class for the learner shell body (beyond Inter/Manrope Latin).
 */
export function bodyFontClassForLocale(locale: string): string {
  const l = locale as AppLocale
  if (l === 'zh-CN' || l === 'zh-TW') return 'font-noto-sc'
  if (l === 'ja') return 'font-noto-jp'
  if (l === 'ko') return 'font-noto-kr'
  if (
    l === 'ar'
    || l === 'hi'
    || l === 'bn'
    || l === 'ta'
    || l === 'te'
    || l === 'ur'
    || l === 'fa'
    || l === 'he'
    || l === 'th'
    || l === 'gu'
    || l === 'pa'
    || l === 'ne'
    || l === 'mr'
    || l === 'sa'
    || l === 'kn'
    || l === 'ru'
    || l === 'uk'
  ) {
    return 'font-noto-intl'
  }
  return 'font-sans'
}

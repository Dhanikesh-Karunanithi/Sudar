import {
  APP_LOCALES,
  DEFAULT_APP_LOCALE,
  type AppLocale,
} from '../../../shared/i18nLocales'

export { APP_LOCALES, DEFAULT_APP_LOCALE, type AppLocale }

export const locales = [...APP_LOCALES] as string[]
export const defaultLocale: AppLocale = DEFAULT_APP_LOCALE

export const routing = {
  locales,
  defaultLocale,
  localePrefix: 'never' as const,
  localeDetection: false,
}

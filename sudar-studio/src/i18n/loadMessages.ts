import type { AbstractIntlMessages } from 'next-intl'
import { clampAppLocale } from '../../../shared/i18nLocales'

import en from '../messages/en.json'

/** Studio ships English strings first; other locales fall back until translated. */
export function loadMessagesSync(locale: string): AbstractIntlMessages {
  void clampAppLocale(locale)
  return en
}

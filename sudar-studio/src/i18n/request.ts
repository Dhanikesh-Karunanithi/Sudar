import { getRequestConfig } from 'next-intl/server'
import { cookies } from 'next/headers'
import { defaultLocale } from './routing'
import { loadMessagesSync } from './loadMessages'
import { clampAppLocale } from '../../../shared/i18nLocales'

export default getRequestConfig(async () => {
  const store = await cookies()
  const fromCookie = store.get('NEXT_LOCALE')?.value
  const locale = clampAppLocale(fromCookie ?? defaultLocale)

  return {
    locale,
    messages: loadMessagesSync(locale),
  }
})

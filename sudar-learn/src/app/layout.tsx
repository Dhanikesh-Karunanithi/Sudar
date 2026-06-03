import type { Metadata } from 'next'
import { Inter, Manrope, Noto_Sans, Noto_Sans_JP, Noto_Sans_KR, Noto_Sans_SC } from 'next/font/google'
import './globals.css'
import './course-personas.css'
import { ThemeProvider } from '@/contexts/ThemeContext'
import { NextIntlClientProvider } from 'next-intl'
import { getLocale, getMessages, setRequestLocale } from 'next-intl/server'
import { isRtlLocale } from '../../../shared/i18nLocales'
import { bodyFontClassForLocale } from '@/lib/i18n/localeFonts'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-body',
  display: 'swap',
})
const manrope = Manrope({
  subsets: ['latin'],
  variable: '--font-heading',
  display: 'swap',
})

const notoSansIntl = Noto_Sans({
  subsets: ['latin', 'latin-ext', 'devanagari', 'cyrillic', 'cyrillic-ext', 'vietnamese'],
  variable: '--font-noto-intl',
  display: 'swap',
})

const notoSansSC = Noto_Sans_SC({
  subsets: ['latin'],
  variable: '--font-noto-sc',
  weight: ['400', '500', '600', '700'],
  display: 'swap',
})

const notoSansJP = Noto_Sans_JP({
  subsets: ['latin'],
  variable: '--font-noto-jp',
  weight: ['400', '500', '600', '700'],
  display: 'swap',
})

const notoSansKR = Noto_Sans_KR({
  subsets: ['latin'],
  variable: '--font-noto-kr',
  weight: ['400', '500', '600', '700'],
  display: 'swap',
})

export const metadata: Metadata = {
  title: { default: 'Sudar Learn — AI-Powered Personalized Learning', template: '%s | Sudar Learn' },
  description: 'Your personalized AI-powered learning experience.',
  icons: {
    icon: [{ url: '/icon.svg', type: 'image/svg+xml' }],
    shortcut: '/icon.svg',
    apple: '/icon.svg',
  },
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const locale = await getLocale()
  setRequestLocale(locale)
  const messages = await getMessages()
  const dir = isRtlLocale(locale) ? 'rtl' : 'ltr'
  const bodyFont = bodyFontClassForLocale(locale)

  return (
    <html lang={locale} dir={dir} suppressHydrationWarning>
      <body
        className={`${inter.variable} ${manrope.variable} ${notoSansIntl.variable} ${notoSansSC.variable} ${notoSansJP.variable} ${notoSansKR.variable} ${bodyFont} antialiased`}
        suppressHydrationWarning
      >
        <NextIntlClientProvider locale={locale} messages={messages}>
          <ThemeProvider>{children}</ThemeProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  )
}

import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })

export const metadata: Metadata = {
  title: {
    default: '知恵塾 - 学習のためのオペレーティングシステム',
    template: '%s | 知恵塾',
  },
  description: '知恵塾はAIネイティブな学習オペレーティングシステムです。数分で研修を作成、アダプティブに配信し、すべての学習者に記憶するチューターを提供します。あなたと共に、あなたのために学びます。',
  keywords: ['学習管理システム', 'LMS', 'AIチューター', 'アダプティブラーニング', 'eラーニング', '企業研修', 'インストラクショナルデザイン', 'SCORM'],
  authors: [{ name: 'Dhanikesh Karunanithi' }],
  creator: 'Dhanikesh Karunanithi',
  openGraph: {
    type: 'website',
    locale: 'ja_JP',
    url: 'https://rhgj.jp',
    siteName: '知恵塾',
    title: '知恵塾 - 学習のためのオペレーティングシステム',
    description: 'あなたと共に、あなたのために学びます。数分で研修を作成、アダプティブに配信し、すべての学習者に記憶するチューターを提供します。',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: '知恵塾 - 学習のためのオペレーティングシステム',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: '知恵塾 - 学習のためのオペレーティングシステム',
    description: 'あなたと共に、あなたのために学びます。数分で研修を作成、アダプティブに配信し、すべての学習者に記憶するチューターを提供します。',
    images: ['/og-image.png'],
    creator: '@知恵塾',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  manifest: '/manifest.json',
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon-16x16.png',
    apple: '/apple-touch-icon.png',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ja" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans antialiased`}>
        <Header />
        <main className="min-h-screen">{children}</main>
        <Footer />
      </body>
    </html>
  )
}

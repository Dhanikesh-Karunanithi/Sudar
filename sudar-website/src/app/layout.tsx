import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })

export const metadata: Metadata = {
  title: {
    default: 'Sudar - The Operating System for Learning',
    template: '%s | Sudar',
  },
  description: 'Sudar is the AI-native Learning Operating System. Build training in minutes, deliver it adaptively, and give every learner a tutor that remembers. Learns with you, for you.',
  keywords: ['learning management system', 'LMS', 'AI tutor', 'adaptive learning', 'eLearning', 'corporate training', 'instructional design', 'SCORM'],
  authors: [{ name: 'Dhanikesh Karunanithi' }],
  creator: 'Dhanikesh Karunanithi',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://sudar.dev',
    siteName: 'Sudar',
    title: 'Sudar - The Operating System for Learning',
    description: 'Learns with you, for you. Build training in minutes, deliver it adaptively, and give every learner a tutor that remembers.',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Sudar - The Operating System for Learning',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Sudar - The Operating System for Learning',
    description: 'Learns with you, for you. Build training in minutes, deliver it adaptively, and give every learner a tutor that remembers.',
    images: ['/og-image.png'],
    creator: '@sudar',
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
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans antialiased`}>
        <Header />
        <main className="min-h-screen">{children}</main>
        <Footer />
      </body>
    </html>
  )
}

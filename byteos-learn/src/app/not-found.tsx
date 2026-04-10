import Link from 'next/link'
import { Home } from 'lucide-react'
import { SudarLogoMark } from '@/components/branding/SudarLogo'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-center">
      <div className="relative mb-6 flex h-14 w-44 max-w-[min(100%,12rem)] items-center justify-center">
        <span className="sr-only">Sudar</span>
        <SudarLogoMark className="h-full w-full text-primary" starFill="var(--background)" />
      </div>
      <h1 className="text-2xl font-bold text-card-foreground mb-2">Page not found</h1>
      <p className="text-muted-foreground mb-8 max-w-sm">
        The page you&apos;re looking for doesn&apos;t exist or has been moved.
      </p>
      <Link
        href="/"
        className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground font-medium rounded-lg hover:opacity-90 transition-opacity"
      >
        <Home className="w-4 h-4" />
        Go back home
      </Link>
    </div>
  )
}

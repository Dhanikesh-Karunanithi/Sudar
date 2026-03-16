import Link from 'next/link'
import { Home } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-center">
      <div className="relative w-20 h-20 mb-6">
        <span className="sr-only">Sudar</span>
        <div
          className="absolute inset-0 bg-primary block dark:hidden logo-mask-light rounded-2xl"
          aria-hidden
        />
        <div
          className="absolute inset-0 bg-primary hidden dark:block logo-mask-dark rounded-2xl"
          aria-hidden
        />
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

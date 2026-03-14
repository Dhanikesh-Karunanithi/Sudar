'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import {
  Search,
  ChevronDown,
  LogOut,
  Palette,
  Sun,
  Moon,
  Zap,
  Target,
  Award,
  Settings,
  Brain,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'
import { useState } from 'react'
import { useTheme, type ThemeMode, type PaletteId } from '@/contexts/ThemeContext'

interface TopNavProps {
  user: {
    email: string
    full_name?: string | null
    avatar_url?: string | null
  }
  showOnboardingNudge?: boolean
}

const PALETTES: { id: PaletteId; label: string; swatch: string }[] = [
  { id: 'default', label: 'Violet', swatch: 'bg-[#7c3aed]' },
  { id: 'ocean', label: 'Ocean', swatch: 'bg-[#0ea5e9]' },
  { id: 'forest', label: 'Forest', swatch: 'bg-[#059669]' },
  { id: 'sunset', label: 'Sunset', swatch: 'bg-[#d97706]' },
]

const mainNavItems: { label: string; href: string }[] = [
  { label: 'Learn', href: '/' },
  { label: 'Courses', href: '/courses' },
  { label: 'Paths', href: '/paths' },
  { label: 'Progress', href: '/progress' },
  { label: 'Memory', href: '/memory' },
]

export function TopNav({ user, showOnboardingNudge }: TopNavProps) {
  const pathname = usePathname()
  const router = useRouter()
  const [moreOpen, setMoreOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const { theme, setMode, setPalette } = useTheme()

  async function handleSignOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  const initials = user.full_name
    ? user.full_name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
    : user.email.slice(0, 2).toUpperCase()

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-6 px-6 py-3 border-b border-border bg-card">
      {/* Logo */}
      <Link href="/" className="flex items-center gap-3 shrink-0">
        <div className="relative h-12 w-12 shrink-0">
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
        <span className="font-display text-2xl font-bold tracking-tighter text-card-foreground hidden sm:block">
          Sudar
        </span>
      </Link>

      {/* Center: nav pills — design-system aligned, animated */}
      <nav className="shrink-0 min-w-0 overflow-x-auto no-scrollbar flex items-center gap-1 p-1.5 rounded-full bg-muted border border-border">
        {mainNavItems.map((item) => {
          const isActive =
            item.href === '/'
              ? pathname === '/'
              : pathname.startsWith(item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'relative flex items-center justify-center px-5 py-2.5 rounded-full text-sm font-semibold whitespace-nowrap transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]',
                isActive
                  ? 'text-primary-foreground'
                  : 'text-card-foreground/80 hover:text-card-foreground hover:bg-card'
              )}
            >
              {isActive && (
                <motion.div
                  layoutId="active-pill"
                  className="absolute inset-0 rounded-full bg-primary"
                  transition={{ type: 'spring', bounce: 0.2, stiffness: 400, damping: 30 }}
                />
              )}
              <span className="relative z-10">{item.label}</span>
            </Link>
          )
        })}
        <div className="relative">
          <button
            onClick={() => setMoreOpen((v) => !v)}
            className={cn(
              'relative flex items-center justify-center gap-1 px-5 py-2.5 rounded-full text-sm font-semibold whitespace-nowrap transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]',
              moreOpen
                ? 'text-primary-foreground bg-primary'
                : 'text-card-foreground/80 hover:text-card-foreground hover:bg-card'
            )}
          >
            <span className="relative z-10 flex items-center gap-1">
              More <ChevronDown size={14} className={cn('transition-transform duration-200', moreOpen && 'rotate-180')} />
            </span>
          </button>
          {moreOpen && (
            <>
              <div className="fixed inset-0 z-40 bg-black/5 dark:bg-black/20 backdrop-blur-[2px]" onClick={() => setMoreOpen(false)} aria-hidden />
              <div className="absolute left-0 top-full z-50 mt-2 w-52 overflow-hidden rounded-2xl border border-border/80 bg-card/95 dark:bg-card/98 shadow-xl shadow-black/5 dark:shadow-black/20 py-1">
                <Link
                  href="/progress"
                  onClick={() => setMoreOpen(false)}
                  className="flex items-center gap-2.5 px-3 py-2 text-sm text-muted-foreground hover:bg-muted hover:text-card-foreground transition-colors"
                >
                  <Target className="h-4 w-4" /> Goals
                </Link>
                <Link
                  href="/progress#certifications"
                  onClick={() => setMoreOpen(false)}
                  className="flex items-center gap-2.5 px-3 py-2 text-sm text-muted-foreground hover:bg-muted hover:text-card-foreground transition-colors"
                >
                  <Award className="h-4 w-4" /> Certifications
                </Link>
                <Link
                  href="/memory"
                  onClick={() => setMoreOpen(false)}
                  className="flex items-center gap-2.5 px-3 py-2 text-sm text-muted-foreground hover:bg-muted hover:text-card-foreground transition-colors"
                >
                  <Brain className="h-4 w-4" /> Sudar&apos;s Memory
                </Link>
                <button
                  onClick={() => setMoreOpen(false)}
                  className="flex w-full items-center gap-2.5 px-3 py-2 text-sm text-muted-foreground hover:bg-muted hover:text-destructive transition-colors"
                >
                  <Settings className="h-4 w-4" /> Preferences
                </button>
              </div>
            </>
          )}
        </div>
      </nav>

      {/* Right: onboarding nudge, search, user */}
      <div className="flex items-center gap-4 shrink-0">
        {showOnboardingNudge && (
          <Link
            href="/onboarding"
            className="flex items-center gap-1.5 rounded-button bg-primary/10 px-3 py-1.5 text-sm font-medium text-primary hover:bg-primary/20 transition-colors"
          >
            <Zap className="h-3.5 w-3.5" />
            Set up your profile
          </Link>
        )}
        <div className="relative group hidden md:block">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors h-5 w-5" />
          <input
            type="text"
            placeholder="Search"
            className="bg-muted border border-border rounded-full py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/10 focus:bg-card transition-all w-40 focus:w-56"
          />
        </div>
        <div className="relative">
          <button
            onClick={() => setUserMenuOpen((v) => !v)}
            className="flex items-center gap-2 rounded-button px-2.5 py-1.5 hover:bg-muted transition-colors"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-semibold">
              {initials}
            </div>
            <span className="hidden sm:block max-w-[140px] truncate text-sm font-medium text-card-foreground">
              {user.full_name ?? user.email}
            </span>
            <ChevronDown className={cn('h-4 w-4 text-muted-foreground transition-transform', userMenuOpen && 'rotate-180')} />
          </button>

          {userMenuOpen && (
            <>
              <div className="fixed inset-0 z-40 bg-black/5 dark:bg-black/20 backdrop-blur-[2px]" onClick={() => setUserMenuOpen(false)} aria-hidden />
              <div className="absolute right-0 top-full z-50 mt-2 w-56 overflow-hidden rounded-2xl border border-border/80 bg-card/95 dark:bg-card/98 shadow-xl shadow-black/5 dark:shadow-black/20">
                <div className="border-b border-border px-4 py-3">
                  <p className="truncate text-sm font-medium text-card-foreground">
                    {user.full_name ?? 'Learner'}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">{user.email}</p>
                </div>
                <div className="p-1.5">
                  <div className="px-3 py-2 border-b border-border mb-1.5">
                    <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5 mb-2">
                      <Palette className="h-3.5 w-3.5" /> Theme
                    </p>
                    <div className="flex items-center gap-2 mb-2">
                      <button
                        onClick={() => setMode('light')}
                        className={cn(
                          'flex items-center gap-1.5 rounded-button px-2.5 py-1.5 text-xs font-medium transition-colors',
                          theme.mode === 'light' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted hover:text-card-foreground'
                        )}
                      >
                        <Sun className="h-3.5 w-3.5" /> Light
                      </button>
                      <button
                        onClick={() => setMode('dark')}
                        className={cn(
                          'flex items-center gap-1.5 rounded-button px-2.5 py-1.5 text-xs font-medium transition-colors',
                          theme.mode === 'dark' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted hover:text-card-foreground'
                        )}
                      >
                        <Moon className="h-3.5 w-3.5" /> Dark
                      </button>
                    </div>
                    <p className="text-[11px] text-muted-foreground mb-1.5">Palette</p>
                    <div className="flex flex-wrap gap-1.5">
                      {PALETTES.map((p) => (
                        <button
                          key={p.id}
                          onClick={() => setPalette(p.id)}
                          title={p.label}
                          className={cn(
                            'w-7 h-7 rounded-full border-2 transition-all',
                            p.swatch,
                            theme.palette === p.id ? 'border-card-foreground ring-2 ring-offset-2 ring-primary' : 'border-transparent hover:scale-110'
                          )}
                        />
                      ))}
                    </div>
                  </div>
                  <Link
                    href="/memory"
                    onClick={() => setUserMenuOpen(false)}
                    className="flex w-full items-center gap-2.5 rounded-button px-3 py-2 text-sm text-muted-foreground hover:bg-muted hover:text-card-foreground transition-colors"
                  >
                    Sudar&apos;s Memory
                  </Link>
                  <button
                    onClick={() => { setUserMenuOpen(false); handleSignOut() }}
                    className="flex w-full items-center gap-2.5 rounded-button px-3 py-2 text-sm text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
                  >
                    <LogOut className="h-4 w-4" />
                    Sign out
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  )
}

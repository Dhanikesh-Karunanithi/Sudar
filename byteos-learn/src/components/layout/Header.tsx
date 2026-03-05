'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Zap, ChevronDown, LogOut, Palette, Sun, Moon } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'
import { useState } from 'react'
import { useTheme, type ThemeMode, type PaletteId } from '@/contexts/ThemeContext'

interface HeaderProps {
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

export function Header({ user, showOnboardingNudge }: HeaderProps) {
  const router = useRouter()
  const [menuOpen, setMenuOpen] = useState(false)
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
    <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-border bg-card px-6">
      {/* Minimal: branding (optional duplicate for context) + onboarding nudge */}
      <div className="flex items-center gap-4">
        {showOnboardingNudge && (
          <Link
            href="/onboarding"
            className="flex items-center gap-1.5 rounded-button bg-primary/10 px-3 py-1.5 text-sm font-medium text-primary hover:bg-primary/20 transition-colors"
          >
            <Zap className="h-3.5 w-3.5" />
            Set up your profile
          </Link>
        )}
      </div>

      {/* User menu */}
      <div className="relative">
        <button
          onClick={() => setMenuOpen((v) => !v)}
          className="flex items-center gap-2 rounded-button px-2.5 py-1.5 hover:bg-muted transition-colors"
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-semibold">
            {initials}
          </div>
          <span className="hidden sm:block max-w-[140px] truncate text-sm font-medium text-card-foreground">
            {user.full_name ?? user.email}
          </span>
          <ChevronDown className={cn('h-4 w-4 text-muted-foreground transition-transform', menuOpen && 'rotate-180')} />
        </button>

        {menuOpen && (
          <>
            <div
              className="fixed inset-0 z-40"
              onClick={() => setMenuOpen(false)}
            />
            <div className="absolute right-0 top-full z-50 mt-2 w-56 overflow-hidden rounded-card border border-border bg-card shadow-lg">
              <div className="border-b border-border px-4 py-3">
                <p className="truncate text-sm font-medium text-card-foreground">
                  {user.full_name ?? 'Learner'}
                </p>
                <p className="truncate text-xs text-muted-foreground">{user.email}</p>
              </div>
              <div className="p-1.5">
                {/* Theme: appearance + palette */}
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
                  onClick={() => setMenuOpen(false)}
                  className="flex w-full items-center gap-2.5 rounded-button px-3 py-2 text-sm text-muted-foreground hover:bg-muted hover:text-card-foreground transition-colors"
                >
                  Sudar&apos;s Memory
                </Link>
                <button
                  onClick={() => { setMenuOpen(false); handleSignOut() }}
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
    </header>
  )
}

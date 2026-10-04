'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  LayoutDashboard,
  BookOpen,
  BarChart2,
  LogOut,
  Brain,
  Route,
  Settings,
  HelpCircle,
  Sparkles,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'
import { SudarLogoMark } from '@/components/branding/SudarLogo'
import { isJourneyEnabled } from '@/lib/journey/isJourneyEnabled'

interface SidebarProps {
  user: {
    email: string
    full_name?: string | null
    avatar_url?: string | null
  }
}

const baseNavItems = [
  { label: 'My Learning', href: '/', icon: LayoutDashboard },
  { label: 'Courses', href: '/courses', icon: BookOpen },
  { label: 'Paths', href: '/paths', icon: Route },
  { label: 'Progress', href: '/progress', icon: BarChart2 },
  { label: "Sudar's Memory", href: '/memory', icon: Brain },
  { label: 'Help', href: '/help', icon: HelpCircle },
  { label: 'Settings', href: '/settings', icon: Settings },
] as const

function getNavItems() {
  if (!isJourneyEnabled()) return [...baseNavItems]
  return [
    baseNavItems[0],
    { label: 'SudarNotes', href: '/journey', icon: Sparkles },
    ...baseNavItems.slice(1),
  ]
}

export function Sidebar({ user }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()
  const navItems = getNavItems()

  async function handleSignOut() {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <aside className="flex w-[4.5rem] min-w-[72px] shrink-0 flex-col border-r border-border bg-card min-h-full">
      {/* Logo */}
      <Link
        href="/"
        className="flex flex-col items-center gap-1.5 px-3 py-5 border-b border-border"
      >
        <span className="sr-only">Sudar</span>
        <SudarLogoMark className="h-8 w-auto max-w-[4.5rem] shrink-0 text-primary" starFill="var(--card)" />
        <span className="text-[10px] font-semibold text-primary leading-tight">
          Learn
        </span>
      </Link>

      {/* Nav - docked icons with labels below */}
      <nav className="flex-1 overflow-y-auto py-3 px-2 flex flex-col gap-0.5">
        {navItems.map((item) => {
          const isActive =
            item.href === '/'
              ? pathname === '/'
              : pathname.startsWith(item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex flex-col items-center gap-1 rounded-button py-2.5 px-2 transition-all',
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-muted hover:text-card-foreground'
              )}
            >
              <item.icon
                className="h-5 w-5 shrink-0"
                strokeWidth={isActive ? 2.5 : 2}
              />
              <span className="text-[10px] font-medium leading-tight text-center">
                {item.label}
              </span>
            </Link>
          )
        })}
      </nav>

      {/* Sign out at bottom */}
      <div className="border-t border-border p-2">
        <button
          onClick={handleSignOut}
          className="flex w-full flex-col items-center gap-1 rounded-button py-2.5 px-2 text-muted-foreground hover:bg-muted hover:text-destructive transition-colors"
        >
          <LogOut className="h-5 w-5 shrink-0" />
          <span className="text-[10px] font-medium">Sign out</span>
        </button>
      </div>
    </aside>
  )
}

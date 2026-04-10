'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  BookOpen,
  LayoutDashboard,
  Route,
  Users,
  BarChart2,
  Shield,
  Settings,
  LogOut,
  ChevronRight,
  ArrowLeft,
  Plug,
  Key,
  HelpCircle,
  ShieldCheck,
  GraduationCap,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'
import { useSidebarContent } from '@/contexts/SidebarContentContext'
import { SudarLogoMark } from '@/components/branding/SudarLogo'

interface SidebarProps {
  user: {
    email: string
    full_name?: string | null
    avatar_url?: string | null
  }
  orgRole?: 'ADMIN' | 'MANAGER' | 'CREATOR' | 'LEARNER'
  isSuperAdmin?: boolean
}

const contentNavItems = [
  { label: 'Dashboard', href: '/', icon: LayoutDashboard },
  { label: 'Courses', href: '/courses', icon: BookOpen },
  { label: 'Learning Paths', href: '/paths', icon: Route },
  { label: 'Analytics', href: '/analytics', icon: BarChart2 },
  { label: 'Training compliance', href: '/compliance', icon: Shield },
]

const organizationNavItems = [
  { label: 'Users', href: '/users', icon: Users },
  { label: 'Governance', href: '/governance', icon: ShieldCheck },
  { label: 'Integrations', href: '/integrations', icon: Plug },
  { label: 'AI & API Keys', href: '/settings/keys', icon: Key },
  { label: 'Org settings', href: '/settings', icon: Settings },
  { label: 'Help & Guides', href: '/help', icon: HelpCircle },
  { label: 'Understanding AI', href: '/help/ai-at-sudar', icon: GraduationCap },
]

const superAdminNavItems = [
  { label: 'Platform users', href: '/admin/system', icon: Users },
  { label: 'Organisations', href: '/admin/system?tab=orgs', icon: Shield },
]

export function Sidebar({ user, orgRole = 'LEARNER', isSuperAdmin = false }: SidebarProps) {
  const canManageOrg = orgRole === 'ADMIN' || orgRole === 'MANAGER'
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()
  const sidebarContent = useSidebarContent()

  const initials = user.full_name
    ? user.full_name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
    : user.email.slice(0, 2).toUpperCase()

  const isCourseEditPage =
    pathname.startsWith('/courses/') &&
    pathname !== '/courses' &&
    pathname !== '/courses/new' &&
    pathname.split('/').filter(Boolean).length >= 2

  async function handleSignOut() {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <aside className="w-64 bg-background border-r border-border flex flex-col h-full shrink-0">
      {/* Logo */}
      <div className="p-5 border-b border-border">
        <Link href="/" className="flex items-center gap-3 group">
          <SudarLogoMark className="h-8 w-auto max-w-[5.5rem] shrink-0 text-card-foreground" starFill="var(--background)" />
          <div>
            <p className="text-card-foreground font-semibold text-sm leading-tight">Sudar</p>
            <p className="text-primary text-xs font-medium">SudarLab</p>
          </div>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto flex flex-col min-h-0">
        {isCourseEditPage ? (
          <>
            <Link
              href="/courses"
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-muted-foreground hover:text-card-foreground hover:bg-muted transition-all group"
            >
              <ArrowLeft className="w-4 h-4 shrink-0 text-muted-foreground group-hover:text-card-foreground" />
              <span className="flex-1">Back to courses</span>
            </Link>
            <p className="px-3 mt-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              Editing course
            </p>
            {sidebarContent?.content && (
              <div className="mt-2 space-y-1">
                {sidebarContent.content}
              </div>
            )}
          </>
        ) : (
          <>
            <p className="px-3 mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              Content
            </p>
            {contentNavItems.map((item) => {
              const isActive =
                item.href === '/'
                  ? pathname === '/'
                  : pathname.startsWith(item.href)
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all group',
                    isActive
                      ? 'bg-primary/10 text-primary border border-primary/20'
                      : 'text-muted-foreground hover:text-card-foreground hover:bg-muted'
                  )}
                >
                  <item.icon
                    className={cn(
                      'w-4 h-4 shrink-0',
                      isActive ? 'text-primary' : 'text-muted-foreground group-hover:text-card-foreground'
                    )}
                    strokeWidth={isActive ? 2.5 : 2}
                  />
                  <span className="flex-1">{item.label}</span>
                  {isActive && (
                    <ChevronRight className="w-3 h-3 text-primary" />
                  )}
                </Link>
              )
            })}
            {canManageOrg && (
              <>
                <p className="px-3 mt-4 mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Organization
                </p>
                {organizationNavItems.map((item) => {
                  const isActive = pathname.startsWith(item.href)
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={cn(
                        'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all group',
                        isActive
                          ? 'bg-indigo-600/15 text-indigo-300 border border-indigo-500/20'
                          : 'text-muted-foreground hover:text-card-foreground hover:bg-muted'
                      )}
                    >
                      <item.icon
                        className={cn(
                          'w-4 h-4 shrink-0',
                          isActive ? 'text-indigo-400' : 'text-muted-foreground group-hover:text-card-foreground'
                        )}
                        strokeWidth={isActive ? 2.5 : 2}
                      />
                      <span className="flex-1">{item.label}</span>
                      {isActive && (
                        <ChevronRight className="w-3 h-3 text-indigo-500" />
                      )}
                    </Link>
                  )
                })}
              </>
            )}

            {isSuperAdmin && (
              <>
                <p className="px-3 mt-4 mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Platform
                </p>
                {superAdminNavItems.map((item) => {
                  const isActive = pathname.startsWith('/admin/system') && (item.href === '/admin/system'
                    ? !pathname.includes('orgs')
                    : pathname.startsWith('/admin/system'))
                  return (
                    <Link
                      key={item.label}
                      href={item.href}
                      className={cn(
                        'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all group',
                        isActive
                          ? 'bg-indigo-600/15 text-indigo-300 border border-indigo-500/20'
                          : 'text-muted-foreground hover:text-card-foreground hover:bg-muted'
                      )}
                    >
                      <item.icon
                        className={cn(
                          'w-4 h-4 shrink-0',
                          isActive ? 'text-indigo-400' : 'text-muted-foreground group-hover:text-card-foreground'
                        )}
                        strokeWidth={isActive ? 2.5 : 2}
                      />
                      <span className="flex-1">{item.label}</span>
                      {isActive && (
                        <ChevronRight className="w-3 h-3 text-indigo-500" />
                      )}
                    </Link>
                  )
                })}
              </>
            )}

            {/* Content development panel (injected by other pages) */}
            {sidebarContent?.content && (
              <div className="mt-4 pt-4 border-t border-border space-y-2">
                <p className="px-3 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Content tools
                </p>
                <div className="space-y-1">
                  {sidebarContent.content}
                </div>
              </div>
            )}
          </>
        )}
      </nav>

      {/* User info */}
      <div className="p-3 border-t border-border space-y-0.5">
        {/* User info */}
        <div className="flex items-center gap-3 px-3 py-3 mt-1">
          <div className="w-8 h-8 rounded-full bg-primary/10 border border-primary/30 flex items-center justify-center shrink-0">
            <span className="text-primary text-xs font-semibold">{initials}</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-card-foreground text-sm font-medium truncate leading-tight">
              {user.full_name ?? 'User'}
            </p>
            <p className="text-muted-foreground text-xs truncate">{user.email}</p>
          </div>
          <button
            onClick={handleSignOut}
            title="Sign out"
            className="p-1.5 rounded-md text-muted-foreground hover:text-card-foreground hover:bg-muted transition-all"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  )
}

'use client'

import Link from 'next/link'
import Image from 'next/image'
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
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'
import { useSidebarContent } from '@/contexts/SidebarContentContext'

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
  { label: 'Compliance', href: '/compliance', icon: Shield },
]

const organizationNavItems = [
  { label: 'Users', href: '/users', icon: Users },
  { label: 'Integrations', href: '/integrations', icon: Plug },
  { label: 'AI & API Keys', href: '/settings/keys', icon: Key },
  { label: 'Org settings', href: '/settings', icon: Settings },
  { label: 'Help & Guides', href: '/help', icon: HelpCircle },
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
    <aside className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col h-full shrink-0">
      {/* Logo */}
      <div className="p-5 border-b border-slate-800">
        <Link href="/" className="flex items-center gap-3 group">
          <div className="relative w-8 h-8 shrink-0">
            <Image
              src="/sudar-logo-dark.png"
              alt="Sudar"
              fill
              className="object-contain"
              sizes="32px"
            />
          </div>
          <div>
            <p className="text-white font-semibold text-sm leading-tight">Sudar</p>
            <p className="text-indigo-400 text-xs font-medium">SudarLab</p>
          </div>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto flex flex-col min-h-0">
        {isCourseEditPage ? (
          <>
            <Link
              href="/courses"
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-all group"
            >
              <ArrowLeft className="w-4 h-4 shrink-0 text-slate-500 group-hover:text-slate-300" />
              <span className="flex-1">Back to courses</span>
            </Link>
            <p className="px-3 mt-2 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
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
            <p className="px-3 mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
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
                      ? 'bg-indigo-600/15 text-indigo-300 border border-indigo-500/20'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                  )}
                >
                  <item.icon
                    className={cn(
                      'w-4 h-4 shrink-0',
                      isActive ? 'text-indigo-400' : 'text-slate-500 group-hover:text-slate-300'
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
            {canManageOrg && (
              <>
                <p className="px-3 mt-4 mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
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
                          : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                      )}
                    >
                      <item.icon
                        className={cn(
                          'w-4 h-4 shrink-0',
                          isActive ? 'text-indigo-400' : 'text-slate-500 group-hover:text-slate-300'
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
                <p className="px-3 mt-4 mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
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
                          : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                      )}
                    >
                      <item.icon
                        className={cn(
                          'w-4 h-4 shrink-0',
                          isActive ? 'text-indigo-400' : 'text-slate-500 group-hover:text-slate-300'
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
              <div className="mt-4 pt-4 border-t border-slate-800 space-y-2">
                <p className="px-3 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
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
      <div className="p-3 border-t border-slate-800 space-y-0.5">
        {/* User info */}
        <div className="flex items-center gap-3 px-3 py-3 mt-1">
          <div className="w-8 h-8 rounded-full bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center shrink-0">
            <span className="text-indigo-300 text-xs font-semibold">{initials}</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-slate-200 text-sm font-medium truncate leading-tight">
              {user.full_name ?? 'User'}
            </p>
            <p className="text-slate-500 text-xs truncate">{user.email}</p>
          </div>
          <button
            onClick={handleSignOut}
            title="Sign out"
            className="p-1.5 rounded-md text-slate-500 hover:text-slate-300 hover:bg-slate-800 transition-all"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  )
}

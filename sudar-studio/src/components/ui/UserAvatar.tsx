'use client'

import { cn } from '@/lib/utils'

export type UserAvatarSize = 'xs' | 'sm' | 'md' | 'lg'

const SIZE_CLASS: Record<UserAvatarSize, string> = {
  xs: 'h-6 w-6 text-[10px]',
  sm: 'h-8 w-8 text-xs',
  md: 'h-10 w-10 text-sm',
  lg: 'h-12 w-12 text-base',
}

function initialsFromUser(email: string, fullName?: string | null) {
  if (fullName?.trim()) {
    const parts = fullName.trim().split(/\s+/).filter(Boolean)
    if (parts.length > 0) {
      const letters = parts.map((p) => p[0]).join('').toUpperCase()
      return letters.slice(0, 2)
    }
  }
  const e = email.trim()
  if (e.length >= 2) return e.slice(0, 2).toUpperCase()
  if (e.length === 1) return `${e.toUpperCase()}?`
  return '?'
}

export interface UserAvatarProps {
  email: string
  fullName?: string | null
  avatarUrl?: string | null
  size?: UserAvatarSize
  className?: string
  label?: string
}

export function UserAvatar({
  email,
  fullName,
  avatarUrl,
  size = 'md',
  className,
  label,
}: UserAvatarProps) {
  const initials = initialsFromUser(email, fullName)
  const alt = label ?? (fullName?.trim() ? `${fullName} avatar` : 'User avatar')

  if (avatarUrl) {
    return (
      <span
        className={cn(
          'relative inline-flex shrink-0 overflow-hidden rounded-full bg-muted ring-1 ring-border',
          SIZE_CLASS[size],
          className
        )}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={avatarUrl} alt={alt} className="h-full w-full object-cover" />
      </span>
    )
  }

  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center justify-center rounded-full bg-primary font-semibold text-primary-foreground ring-1 ring-border',
        SIZE_CLASS[size],
        className
      )}
      aria-label={label ?? alt}
    >
      {initials}
    </span>
  )
}

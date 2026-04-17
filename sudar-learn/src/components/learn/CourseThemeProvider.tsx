'use client'

import { useEffect, useRef, type ReactNode } from 'react'
import { getLearningPersona } from '@/lib/themes/learningPersonas'

interface CourseThemeProviderProps {
  template: string | null | undefined
  children: ReactNode
}

/**
 * Applies the course's visual persona via CSS custom properties.
 * Injects Google Fonts when a persona is selected and sets --color-bg, --color-fg, --color-accent, etc.
 */
export function CourseThemeProvider({ template, children }: CourseThemeProviderProps) {
  const persona = getLearningPersona(template)
  const linkRef = useRef<HTMLLinkElement | null>(null)

  useEffect(() => {
    if (!persona?.fontUrl) return
    const id = 'course-theme-fonts'
    let link = document.getElementById(id) as HTMLLinkElement | null
    if (!link) {
      link = document.createElement('link')
      link.id = id
      link.rel = 'stylesheet'
      link.href = persona.fontUrl!
      document.head.appendChild(link)
      linkRef.current = link
    } else if (link.getAttribute('href') !== persona.fontUrl) {
      link.href = persona.fontUrl!
    }
    return () => {
      if (linkRef.current?.parentNode) linkRef.current.parentNode.removeChild(linkRef.current)
      linkRef.current = null
    }
  }, [persona?.fontUrl])

  if (!persona) {
    return <>{children}</>
  }

  const isDark = persona.preferredColorScheme === 'dark'
  const primaryFg = isDark ? '#0a0a0a' : '#fafafa'

  const style: React.CSSProperties = {
    ['--course-color-bg' as string]: persona.colorBackground,
    ['--course-color-fg' as string]: persona.colorForeground,
    ['--course-color-accent' as string]: persona.colorAccent,
    ['--course-side-note-accent' as string]: persona.sideNoteAccent,
    ['--background' as string]: persona.colorBackground,
    ['--foreground' as string]: persona.colorForeground,
    ['--primary' as string]: persona.colorAccent,
    ['--primary-foreground' as string]: primaryFg,
    ['--card' as string]: persona.colorBackground,
    ['--card-foreground' as string]: persona.colorForeground,
    ['--border' as string]: persona.borderColor,
    ['--muted' as string]: persona.colorMuted ?? persona.borderColor,
    ['--muted-foreground' as string]: persona.colorMuted ?? persona.colorForeground,
    ['--radius-card' as string]: persona.borderRadius,
    ['--radius-xl' as string]: persona.borderRadius,
    ['--font-display' as string]: persona.fontDisplay,
    fontFamily: persona.fontBody,
  }

  return (
    <div
      className="course-theme-provider min-h-full"
      data-persona={persona.slug}
      data-theme={persona.preferredColorScheme}
      style={style}
    >
      {children}
    </div>
  )
}

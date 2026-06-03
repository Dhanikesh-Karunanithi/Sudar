/**
 * Sudar Learn — Theme Renderer Component
 * Applies premium visual themes to course content
 */

'use client'

import React from 'react'
import type { ThemeSlug } from '@/types/contentThemes'
import '@/themes/caloraEditorial.css'

interface ThemeRendererProps {
  theme: ThemeSlug
  children: React.ReactNode
  className?: string
}

export function ThemeRenderer({ theme, children, className = '' }: ThemeRendererProps) {
  const themeClass = `theme-${theme.replace(/_/g, '-')}`
  
  return (
    <div className={`theme-wrapper ${themeClass} ${className}`}>
      {children}
    </div>
  )
}

export default ThemeRenderer

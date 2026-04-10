'use client'

import { createContext, useContext, useEffect, useState } from 'react'

export type ThemeMode = 'light' | 'dark'
export type PaletteId = 'default' | 'ocean' | 'forest' | 'sunset'

interface ThemeState {
  mode: ThemeMode
  palette: PaletteId
}

const STORAGE_KEY = 'byteos-learn-theme'

const defaultState: ThemeState = {
  mode: 'light',
  palette: 'default',
}

function normalizePalette(value: unknown): PaletteId {
  if (value === 'ocean' || value === 'forest' || value === 'sunset') {
    return value
  }
  return 'default'
}

function loadTheme(): ThemeState {
  if (typeof window === 'undefined') return defaultState
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return defaultState
    const parsed = JSON.parse(raw) as Partial<ThemeState>
    return {
      mode: parsed.mode === 'dark' ? 'dark' : 'light',
      palette: normalizePalette(parsed.palette),
    }
  } catch {
    return defaultState
  }
}

function saveTheme(state: ThemeState) {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch {}
}

const ThemeContext = createContext<{
  theme: ThemeState
  setMode: (mode: ThemeMode) => void
  setPalette: (palette: PaletteId) => void
}>({ theme: defaultState, setMode: () => {}, setPalette: () => {} })

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<ThemeState>(defaultState)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setTheme(loadTheme())
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!mounted) return
    document.documentElement.dataset.theme = theme.mode
    document.documentElement.dataset.palette = theme.palette
    if (theme.mode === 'dark') {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
    saveTheme(theme)
  }, [theme, mounted])

  const setMode = (mode: ThemeMode) => setTheme((t) => ({ ...t, mode }))
  const setPalette = (palette: PaletteId) => setTheme((t) => ({ ...t, palette }))

  return (
    <ThemeContext.Provider value={{ theme, setMode, setPalette }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  return useContext(ThemeContext)
}

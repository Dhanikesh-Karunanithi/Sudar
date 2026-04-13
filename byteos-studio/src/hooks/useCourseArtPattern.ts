'use client'

import { useCallback, useSyncExternalStore } from 'react'
import { isCourseArtPattern, type CourseArtPattern } from '@/lib/courseDefaultArt'

export const COURSE_ART_PATTERN_STORAGE_KEY = 'sudar.courseArt.pattern'

const listeners = new Set<() => void>()

function readPattern(): CourseArtPattern {
  if (typeof window === 'undefined') return 'grid'
  const raw = window.localStorage.getItem(COURSE_ART_PATTERN_STORAGE_KEY)
  if (raw && isCourseArtPattern(raw)) return raw
  return 'grid'
}

function emit() {
  listeners.forEach((l) => l())
}

function subscribe(onChange: () => void) {
  const onStorage = (e: StorageEvent) => {
    if (e.key === COURSE_ART_PATTERN_STORAGE_KEY || e.key === null) onChange()
  }
  window.addEventListener('storage', onStorage)
  listeners.add(onChange)
  return () => {
    window.removeEventListener('storage', onStorage)
    listeners.delete(onChange)
  }
}

/**
 * Live pattern for default course art (thumbnail/banner when no custom image).
 * Stored in `localStorage` under {@link COURSE_ART_PATTERN_STORAGE_KEY}; updates sync across
 * components in the same tab and across browser tabs.
 */
export function useCourseArtPattern(): CourseArtPattern {
  return useSyncExternalStore(subscribe, readPattern, () => 'grid')
}

export function setCourseArtPattern(pattern: CourseArtPattern): void {
  if (typeof window === 'undefined') return
  if (!isCourseArtPattern(pattern)) return
  window.localStorage.setItem(COURSE_ART_PATTERN_STORAGE_KEY, pattern)
  emit()
}

export function useSetCourseArtPattern(): (pattern: CourseArtPattern) => void {
  return useCallback((pattern: CourseArtPattern) => {
    setCourseArtPattern(pattern)
  }, [])
}

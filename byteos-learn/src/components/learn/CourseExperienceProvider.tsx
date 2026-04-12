'use client'

import dynamic from 'next/dynamic'
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { parseExperienceSettings } from '@/lib/themes/courseSettingsExperience'
import type { ExperiencePackSlug } from '@/lib/themes/experiencePacks'
import { ExperienceAmbientLayer } from '@/components/learn/ExperienceAmbientLayer'

const MotionAccents = dynamic(() => import('@/components/learn/ExperiencePackMotionAccents'), {
  ssr: false,
})

const STORAGE_PREFIX = 'sudar-learn:course-experience-calm:'

export interface CourseExperienceContextValue {
  calmMode: boolean
  effectiveCalm: boolean
  setCalmMode: (value: boolean) => void
  activePack: ExperiencePackSlug
  immersiveEnabled: boolean
  systemReducedMotion: boolean
}

const CourseExperienceContext = createContext<CourseExperienceContextValue | null>(null)

export function useCourseExperience(): CourseExperienceContextValue {
  const v = useContext(CourseExperienceContext)
  if (!v) {
    throw new Error('useCourseExperience must be used within CourseExperienceProvider')
  }
  return v
}

interface CourseExperienceProviderProps {
  courseId: string
  settings: Record<string, unknown> | null | undefined
  children: ReactNode
}

export function CourseExperienceProvider({
  courseId,
  settings,
  children,
}: CourseExperienceProviderProps) {
  const { pack: activePack } = parseExperienceSettings(settings)
  const [mounted, setMounted] = useState(false)
  const [systemReducedMotion, setSystemReducedMotion] = useState(false)
  const [userCalm, setUserCalm] = useState<boolean | null>(null)

  useEffect(() => {
    setMounted(true)
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    const applyMq = () => setSystemReducedMotion(mq.matches)
    applyMq()
    mq.addEventListener('change', applyMq)
    try {
      const raw = localStorage.getItem(`${STORAGE_PREFIX}${courseId}`)
      if (raw === '1') setUserCalm(true)
      else if (raw === '0') setUserCalm(false)
    } catch {
      setUserCalm(false)
    }
    return () => mq.removeEventListener('change', applyMq)
  }, [courseId])

  const effectiveCalm = systemReducedMotion || (userCalm ?? false)
  const immersiveEnabled = activePack !== 'none' && !effectiveCalm

  const setCalmMode = useCallback(
    (value: boolean) => {
      if (systemReducedMotion) return
      setUserCalm(value)
      try {
        localStorage.setItem(`${STORAGE_PREFIX}${courseId}`, value ? '1' : '0')
      } catch {
        /* ignore */
      }
    },
    [courseId, systemReducedMotion]
  )

  const ctx = useMemo<CourseExperienceContextValue>(
    () => ({
      calmMode: userCalm ?? false,
      effectiveCalm,
      setCalmMode,
      activePack,
      immersiveEnabled,
      systemReducedMotion,
    }),
    [userCalm, effectiveCalm, setCalmMode, activePack, immersiveEnabled, systemReducedMotion]
  )

  const showDecor = mounted && activePack !== 'none' && !effectiveCalm

  return (
    <CourseExperienceContext.Provider value={ctx}>
      <div
        className="flex flex-1 flex-col min-h-0 overflow-hidden relative"
        data-motion={effectiveCalm ? 'calm' : 'immersive'}
        data-experience={activePack}
      >
        {showDecor && (
          <>
            <ExperienceAmbientLayer pack={activePack as Exclude<ExperiencePackSlug, 'none'>} />
            <div className="pointer-events-none absolute inset-0 z-[1] overflow-hidden">
              <MotionAccents pack={activePack as Exclude<ExperiencePackSlug, 'none'>} />
            </div>
          </>
        )}
        <div className="relative z-[2] flex flex-col flex-1 min-h-0">{children}</div>
      </div>
    </CourseExperienceContext.Provider>
  )
}

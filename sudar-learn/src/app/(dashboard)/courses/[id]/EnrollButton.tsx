'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { GraduationCap, PlayCircle, BookOpen } from 'lucide-react'
import { SudarInlineLoader } from '@/components/branding/SudarBrandLoader'

interface Props {
  courseId: string
  isEnrolled: boolean
  hasModules: boolean
  isExternal?: boolean
  firstModuleId?: string
  progressPct?: number
  enrollmentStatus?: string
}

export function EnrollButton({
  courseId,
  isEnrolled,
  hasModules,
  isExternal = false,
  firstModuleId,
  progressPct = 0,
  enrollmentStatus,
}: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const isCompleted = enrollmentStatus === 'completed' || progressPct >= 100

  function getCtaLabel(): string {
    if (isExternal) {
      if (!isEnrolled) return 'Enrol & learn in Sudar'
      if (progressPct >= 100) return 'Review in Sudar'
      if (progressPct > 0) return 'Continue in Sudar'
      return 'Open in Sudar'
    }
    if (!isEnrolled) return 'Enrol & Start Course'
    if (progressPct >= 100) return 'Review Course'
    if (progressPct > 0) return 'Continue Learning'
    return 'Start Course'
  }

  async function handleEnroll() {
    setLoading(true)
    setError(null)

    const res = await fetch('/api/enrollments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ course_id: courseId }),
    })

    if (!res.ok) {
      const data = await res.json()
      setError(data.error ?? 'Failed to enroll')
      setLoading(false)
      return
    }

    router.refresh()
    if (isExternal) {
      router.push(`/courses/${courseId}/learn`)
    } else if (firstModuleId) {
      router.push(`/courses/${courseId}/learn?module=${firstModuleId}`)
    }
  }

  function learnHref() {
    if (isExternal) return `/courses/${courseId}/learn`
    if (firstModuleId) return `/courses/${courseId}/learn?module=${firstModuleId}`
    return null
  }

  if (isEnrolled) {
    const href = learnHref()
    const canStart = Boolean(href)
    return (
      <div className="flex flex-col items-center gap-2 w-full max-w-md">
        {error && <p className="text-destructive text-sm">{error}</p>}
        <button
          onClick={() => href && router.push(href)}
          disabled={!canStart}
          className="w-full flex items-center justify-center gap-2.5 px-8 py-3 bg-primary hover:opacity-90 disabled:bg-muted disabled:text-muted-foreground disabled:cursor-not-allowed text-primary-foreground font-semibold rounded-button transition-colors shadow-lg"
        >
          {isCompleted ? (
            <BookOpen className="w-5 h-5" />
          ) : (
            <PlayCircle className="w-5 h-5" />
          )}
          {getCtaLabel()}
        </button>
        {!canStart && (
          <p className="text-muted-foreground text-xs">This course is temporarily unavailable because no modules are published yet.</p>
        )}
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center gap-2 w-full max-w-md">
      {error && <p className="text-destructive text-sm">{error}</p>}
      <button
        onClick={handleEnroll}
        disabled={loading || !hasModules}
        className="w-full flex items-center justify-center gap-2.5 px-8 py-3 bg-primary hover:opacity-90 disabled:bg-muted disabled:cursor-not-allowed text-primary-foreground font-semibold rounded-button transition-colors shadow-lg"
      >
        {loading ? (
          <SudarInlineLoader size="md" className="text-primary-foreground" starFill="var(--primary)" />
        ) : (
          <GraduationCap className="w-5 h-5" />
        )}
        {loading ? 'Enrolling...' : getCtaLabel()}
      </button>
      {!hasModules && (
        <p className="text-muted-foreground text-xs">No modules available yet.</p>
      )}
    </div>
  )
}

'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { GraduationCap, PlayCircle, Loader2, BookOpen } from 'lucide-react'

interface Props {
  courseId: string
  isEnrolled: boolean
  hasModules: boolean
  firstModuleId?: string
  progressPct?: number
  enrollmentStatus?: string
}

export function EnrollButton({
  courseId,
  isEnrolled,
  hasModules,
  firstModuleId,
  progressPct = 0,
  enrollmentStatus,
}: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const isCompleted = enrollmentStatus === 'completed' || progressPct >= 100

  function getCtaLabel(): string {
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
    if (firstModuleId) router.push(`/courses/${courseId}/learn?module=${firstModuleId}`)
  }

  if (isEnrolled) {
    return (
      <div className="flex flex-col items-center gap-2 w-full max-w-md">
        {error && <p className="text-destructive text-sm">{error}</p>}
        <button
          onClick={() => firstModuleId && router.push(`/courses/${courseId}/learn?module=${firstModuleId}`)}
          className="w-full flex items-center justify-center gap-2.5 px-8 py-3 bg-primary hover:opacity-90 text-primary-foreground font-semibold rounded-button transition-colors shadow-lg"
        >
          {isCompleted ? (
            <BookOpen className="w-5 h-5" />
          ) : (
            <PlayCircle className="w-5 h-5" />
          )}
          {getCtaLabel()}
        </button>
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
          <Loader2 className="w-5 h-5 animate-spin" />
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

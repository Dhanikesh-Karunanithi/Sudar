'use client'

import { useEffect } from 'react'

/** Learn routes use full viewport (SCORM IDE shells); escape the dashboard card shell. */
export function CourseLearnShell({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    document.documentElement.dataset.courseLearn = '1'
    return () => {
      delete document.documentElement.dataset.courseLearn
    }
  }, [])

  return <>{children}</>
}

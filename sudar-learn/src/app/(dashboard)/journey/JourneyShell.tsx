'use client'

import { useEffect } from 'react'

/** Lock dashboard main scroll so chat + study panels scroll independently. */
export function JourneyShell({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    document.documentElement.dataset.sudarJourney = '1'
    return () => {
      delete document.documentElement.dataset.sudarJourney
    }
  }, [])

  return <>{children}</>
}

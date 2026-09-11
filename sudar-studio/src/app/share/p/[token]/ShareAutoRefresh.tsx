'use client'

import { useEffect } from 'react'

export function ShareAutoRefresh({ seconds }: { seconds: number }) {
  useEffect(() => {
    const id = window.setTimeout(() => {
      window.location.reload()
    }, seconds * 1000)
    return () => window.clearTimeout(id)
  }, [seconds])
  return null
}

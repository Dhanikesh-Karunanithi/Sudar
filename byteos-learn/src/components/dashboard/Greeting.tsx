'use client'

import { useState, useEffect } from 'react'

function getGreeting(): string {
  const hour = new Date().getHours()
  if (hour >= 0 && hour < 5) return 'Good night'
  if (hour < 12) return 'Good morning'
  if (hour < 17) return 'Good afternoon'
  return 'Good evening'
}

export function Greeting({ firstName }: { firstName: string }) {
  const [greeting, setGreeting] = useState('Good morning')

  useEffect(() => {
    setGreeting(getGreeting())
  }, [])

  return <>{greeting}, {firstName}.</>
}

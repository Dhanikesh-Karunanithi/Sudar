'use client'

import { useState, useEffect } from 'react'

interface GreetingConfig {
  timeSlot: 'early_bird' | 'morning' | 'afternoon' | 'evening' | 'night_owl'
  hour: number
}

function getTimeSlot(hour: number): GreetingConfig['timeSlot'] {
  if (hour >= 5 && hour < 9) return 'early_bird'
  if (hour >= 9 && hour < 12) return 'morning'
  if (hour >= 12 && hour < 17) return 'afternoon'
  if (hour >= 17 && hour < 22) return 'evening'
  return 'night_owl'
}

/**
 * Generates engaging, contextual greetings based on time of day.
 * Not generic "good morning" — more like "You're up early!" or "Night owl alert!"
 */
function generateGreeting(firstName: string, timeSlot: GreetingConfig['timeSlot']): string {
  const name = (firstName || '').trim()
  const nameStr = name ? name : 'there'

  const greetings: Record<GreetingConfig['timeSlot'], string[]> = {
    early_bird: [
      `Rise and shine, ${nameStr}! ☀️`,
      `Up before the world, ${nameStr}? That's dedication.`,
      `Morning champion, ${nameStr}!`,
      `Early to learn, ${nameStr}. We like it.`,
    ],
    morning: [
      `Ready to level up today, ${nameStr}?`,
      `Welcome back, ${nameStr}!`,
      `Time to learn, ${nameStr}.`,
      `Good to see you, ${nameStr}!`,
      `Let's make today count, ${nameStr}.`,
    ],
    afternoon: [
      `Back for round two, ${nameStr}?`,
      `${nameStr}, afternoon learner — love it!`,
      `Let's keep the momentum, ${nameStr}.`,
      `Still crushing it, ${nameStr}!`,
      `You're on a roll, ${nameStr}.`,
    ],
    evening: [
      `Evening grind, ${nameStr}? Respect.`,
      `Burning the midnight oil already, ${nameStr}?`,
      `Evening focus activated, ${nameStr}.`,
      `${nameStr}, you're back! 🔥`,
      `${nameStr}, this is some serious commitment.`,
    ],
    night_owl: [
      `Hello, ${nameStr}. Night owl energy — welcome back.`,
      `Still awake, ${nameStr}? We like your energy.`,
      `Late-night learner energy, ${nameStr} — nice.`,
      `You're back again, ${nameStr}? Respect the grind.`,
      `The owls are out, ${nameStr}. Welcome back.`,
    ],
  }

  const options = greetings[timeSlot]
  return options[Math.floor(Math.random() * options.length)]
}

export function Greeting({ firstName }: { firstName: string }) {
  const [greeting, setGreeting] = useState('')

  useEffect(() => {
    const hour = new Date().getHours()
    const timeSlot = getTimeSlot(hour)
    const msg = generateGreeting(firstName, timeSlot)
    setGreeting(msg)
  }, [firstName])

  return <>{greeting}</>
}

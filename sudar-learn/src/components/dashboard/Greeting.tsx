'use client'

import { useMemo } from 'react'

export type LearnGreetingContext = {
  streakDays?: number
  weeklyMins?: number
  lastCourseTitle?: string | null
  profileCompleteness?: number
  hasEnrollments?: boolean
}

function buildLearnGreeting(firstName: string, ctx: LearnGreetingContext): string {
  const name = firstName.trim() || 'there'

  if ((ctx.streakDays ?? 0) >= 3) {
    return `Your ${ctx.streakDays}-day streak is live, ${name}. Keep it going today.`
  }
  if (ctx.lastCourseTitle) {
    return `Pick up "${ctx.lastCourseTitle}" where you left off, ${name}.`
  }
  if ((ctx.weeklyMins ?? 0) >= 60) {
    return `You logged ${ctx.weeklyMins} minutes this week, ${name}. Solid focus.`
  }
  if (!ctx.hasEnrollments) {
    return `Welcome, ${name}. Browse courses to start your first module.`
  }
  if ((ctx.profileCompleteness ?? 0) < 50) {
    return `Complete your profile (${ctx.profileCompleteness}%), ${name} — Sudar adapts better with context.`
  }
  if ((ctx.streakDays ?? 0) === 1) {
    return `Day one of your streak, ${name}. One session keeps it alive.`
  }
  return `Welcome back, ${name}. Your next best action is below.`
}

export function Greeting({
  firstName,
  context = {},
}: {
  firstName: string
  context?: LearnGreetingContext
}) {
  const greeting = useMemo(() => buildLearnGreeting(firstName, context), [firstName, context])

  return <>{greeting}</>
}

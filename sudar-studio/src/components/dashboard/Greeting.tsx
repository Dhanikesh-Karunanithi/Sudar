'use client'

import { useMemo } from 'react'

export type StudioGreetingContext = {
  publishedCourses?: number
  draftCourses?: number
  newEnrollmentsThisWeek?: number
  completionsThisWeek?: number
  isMonday?: boolean
}

function buildStudioGreeting(firstName: string, ctx: StudioGreetingContext): string {
  const name = firstName.trim() || 'there'

  if ((ctx.newEnrollmentsThisWeek ?? 0) > 0) {
    const n = ctx.newEnrollmentsThisWeek!
    return `${n} learner${n === 1 ? '' : 's'} joined this week, ${name}. Check progress below.`
  }
  if ((ctx.completionsThisWeek ?? 0) > 0) {
    const n = ctx.completionsThisWeek!
    return `${n} completion${n === 1 ? '' : 's'} this week, ${name}. Momentum is building.`
  }
  if ((ctx.draftCourses ?? 0) > 0 && (ctx.publishedCourses ?? 0) === 0) {
    return `${ctx.draftCourses} draft course${ctx.draftCourses === 1 ? '' : 's'} ready to publish, ${name}.`
  }
  if (ctx.isMonday) {
    return `New week, ${name}. Review learner progress and upcoming deadlines.`
  }
  if ((ctx.publishedCourses ?? 0) > 0) {
    return `Welcome back, ${name}. ${ctx.publishedCourses} course${ctx.publishedCourses === 1 ? '' : 's'} live in Learn.`
  }
  return `Welcome, ${name}. Create your first course when you are ready.`
}

export function Greeting({
  firstName,
  context = {},
}: {
  firstName: string
  context?: StudioGreetingContext
}) {
  const greeting = useMemo(() => {
    const isMonday = new Date().getDay() === 1
    return buildStudioGreeting(firstName, { ...context, isMonday })
  }, [firstName, context])

  return <>{greeting}</>
}

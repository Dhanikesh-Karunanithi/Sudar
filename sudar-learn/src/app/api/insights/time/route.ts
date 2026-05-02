import { NextRequest, NextResponse } from 'next/server'
import { createServiceRoleSupabaseClient, createClient } from '@/lib/supabase/server'
import { computeFocusRatio } from '@/types/analytics'
import { z } from 'zod'

const querySchema = z.object({
  days: z.coerce.number().int().min(1).max(30).default(7),
})

export async function GET(request: NextRequest) {
  if (process.env.ENABLE_ANALYTICS_ENGINE === 'false') {
    return NextResponse.json({ success: false, error: 'Analytics engine disabled' }, { status: 503 })
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })

  const parsed = querySchema.safeParse({
    days: request.nextUrl.searchParams.get('days') ?? '7',
  })
  if (!parsed.success) return NextResponse.json({ success: false, error: 'Invalid query' }, { status: 400 })

  const { days } = parsed.data
  const admin = createServiceRoleSupabaseClient()
  const since = new Date(Date.now() - days * 86400000).toISOString()

  const { data: events } = await admin
    .from('learning_events')
    .select('created_at, duration_secs, payload')
    .eq('user_id', user.id)
    .in('event_type', ['section_heartbeat', 'session_end', 'module_complete', 'drop_off'])
    .gte('created_at', since)
    .order('created_at', { ascending: true })

  const byDay = new Map<string, { active: number; total: number }>()
  for (const ev of events ?? []) {
    const day = String(ev.created_at).slice(0, 10)
    const payload = (ev.payload as Record<string, unknown>) ?? {}
    const active = typeof payload.active_secs === 'number' ? payload.active_secs : Number(ev.duration_secs ?? 0)
    const total = Number(ev.duration_secs ?? 0)
    const current = byDay.get(day) ?? { active: 0, total: 0 }
    current.active += Math.max(0, active)
    current.total += Math.max(0, total)
    byDay.set(day, current)
  }

  const timeline = [...byDay.entries()].map(([date, value]) => {
    const focusRatio = computeFocusRatio(value.active, value.total)
    return {
      date,
      active_secs: value.active,
      idle_secs: Math.max(0, value.total - value.active),
      total_secs: value.total,
      focus_ratio: Number(focusRatio.toFixed(4)),
    }
  })

  const weeklyTotal = timeline.reduce((sum, day) => sum + day.total_secs, 0)
  const weeklyActive = timeline.reduce((sum, day) => sum + day.active_secs, 0)
  const avgDailySecs = timeline.length > 0 ? weeklyTotal / timeline.length : 0
  const recommendationMins = Math.max(10, Math.min(45, Math.round((avgDailySecs / 60) * 0.8)))

  return NextResponse.json({
    success: true,
    data: {
      window_days: days,
      timeline,
      totals: {
        active_secs: weeklyActive,
        idle_secs: Math.max(0, weeklyTotal - weeklyActive),
        total_secs: weeklyTotal,
        focus_ratio: Number(computeFocusRatio(weeklyActive, weeklyTotal).toFixed(4)),
      },
      recommendation: {
        next_session_minutes: recommendationMins,
        rationale:
          weeklyActive === 0
            ? 'Start with a short 10-minute focus block to rebuild consistency.'
            : `A ${recommendationMins}-minute focused session matches your current study rhythm.`,
      },
    },
  })
}

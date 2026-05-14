/**
 * Lightweight formative signals for tutor context (not a high-stakes score).
 */
import type { SupabaseClient } from '@supabase/supabase-js'

export async function buildStruggleSignalsSummary(
  admin: SupabaseClient,
  userId: string,
  options: { courseId?: string; limit?: number } = {},
): Promise<string> {
  const { courseId, limit = 80 } = options
  const since = new Date(Date.now() - 14 * 86400000).toISOString()

  const base = admin
    .from('learning_events')
    .select('event_type, payload, created_at, course_id')
    .eq('user_id', userId)
    .gte('created_at', since)
    .order('created_at', { ascending: false })
    .limit(limit)

  const { data: rows } = courseId ? await base.eq('course_id', courseId) : await base
  if (!rows?.length) return ''

  let dropOffs = 0
  const wrongTopics = new Set<string>()

  for (const ev of rows) {
    if (ev.event_type === 'drop_off') dropOffs += 1
    if (ev.event_type === 'quiz_attempt') {
      const wt = (ev.payload as { wrong_topics?: string[] } | null)?.wrong_topics
      if (Array.isArray(wt)) for (const t of wt) wrongTopics.add(t.slice(0, 80))
    }
  }

  const parts: string[] = []
  if (dropOffs >= 2) parts.push(`${dropOffs} recent sessions ended before completion (the learner may be stuck or interrupted).`)
  if (wrongTopics.size > 0) {
    parts.push(`Recent quiz practice gaps: ${[...wrongTopics].slice(0, 6).join('; ')}.`)
  }

  return parts.join(' ')
}

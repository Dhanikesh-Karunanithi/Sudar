/**
 * GET /api/quests
 * Returns active daily, weekly, and story quests for the current user.
 * Auto-assigns daily quests if not yet assigned today.
 *
 * POST /api/quests/progress — (handled in /api/quests/progress/route.ts)
 */

import { createClient, createServiceRoleSupabaseClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

const DAILY_QUEST_SLUGS = [
  'daily_module_complete',
  'daily_video_15',
  'daily_tutor_ask',
  'daily_checkin',
  'daily_new_modality',
]

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const admin = createServiceRoleSupabaseClient()
  const todayStart = new Date()
  todayStart.setHours(0, 0, 0, 0)

  // Load all quest catalog entries
  const { data: allQuests } = await admin
    .from('quests')
    .select('id, slug, title, description, quest_type, steps, coin_reward, xp_reward')

  const questMap = new Map((allQuests ?? []).map((q) => [q.slug, q]))

  // Load existing learner_quests
  const { data: learnerQuests } = await admin
    .from('learner_quests')
    .select('id, quest_id, status, progress, started_at, completed_at, quests(slug, title, description, quest_type, steps, coin_reward, xp_reward)')
    .eq('user_id', user.id)
    .in('status', ['active', 'completed'])

  const existingQuestIds = new Set((learnerQuests ?? []).map((lq) => {
    const q = lq.quests as { slug: string } | null
    return q?.slug ?? ''
  }))

  // Auto-assign daily quests if not assigned today
  const todayISO = todayStart.toISOString()
  const dailyAssigned = (learnerQuests ?? []).filter((lq) => {
    const q = lq.quests as { quest_type: string } | null
    return q?.quest_type === 'daily' && lq.started_at >= todayISO
  })

  if (dailyAssigned.length < 3) {
    const availableDailySlugs = DAILY_QUEST_SLUGS.filter((slug) => {
      return !dailyAssigned.some((lq) => {
        const q = lq.quests as { slug: string } | null
        return q?.slug === slug
      })
    })

    const toAssign = availableDailySlugs.slice(0, 3 - dailyAssigned.length)
    for (const slug of toAssign) {
      const quest = questMap.get(slug)
      if (!quest) continue
      await admin.from('learner_quests').upsert({
        user_id: user.id,
        quest_id: quest.id,
        status: 'active',
        progress: {},
        started_at: new Date().toISOString(),
      }, { onConflict: 'user_id,quest_id' })
      await admin.from('learning_events').insert({
        user_id: user.id,
        event_type: 'quest_started',
        payload: { quest_id: quest.id, slug: quest.slug, quest_type: quest.quest_type },
      })
    }
  }

  // Auto-assign story quests if not started
  const storyQuests = (allQuests ?? []).filter((q) => q.quest_type === 'story')
  for (const sq of storyQuests) {
    if (existingQuestIds.has(sq.slug)) continue
    await admin.from('learner_quests').upsert({
      user_id: user.id,
      quest_id: sq.id,
      status: 'active',
      progress: {},
      started_at: new Date().toISOString(),
    }, { onConflict: 'user_id,quest_id' })
    await admin.from('learning_events').insert({
      user_id: user.id,
      event_type: 'quest_started',
      payload: { quest_id: sq.id, slug: sq.slug, quest_type: sq.quest_type },
    })
  }

  // Reload after assignment
  const { data: finalQuests } = await admin
    .from('learner_quests')
    .select('id, quest_id, status, progress, started_at, completed_at, quests(slug, title, description, quest_type, steps, coin_reward, xp_reward)')
    .eq('user_id', user.id)
    .order('started_at', { ascending: false })

  const daily = (finalQuests ?? []).filter((lq) => {
    const q = lq.quests as { quest_type: string } | null
    return q?.quest_type === 'daily' && (lq.started_at ?? '') >= todayISO
  })

  const story = (finalQuests ?? []).filter((lq) => {
    const q = lq.quests as { quest_type: string } | null
    return q?.quest_type === 'story'
  })

  const completed = (finalQuests ?? []).filter((lq) => lq.status === 'completed').slice(0, 5)

  return NextResponse.json({
    success: true,
    data: { daily, story, completed },
  })
}

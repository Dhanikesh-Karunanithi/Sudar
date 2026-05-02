/**
 * GET /api/leaderboard/[orgId]
 * Returns the weekly + all-time XP leaderboard for an org.
 */

import { createClient, createServiceRoleSupabaseClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ orgId: string }> }
) {
  const { orgId } = await params

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const admin = createServiceRoleSupabaseClient()

  // Verify user belongs to this org
  const { data: userProfile } = await admin
    .from('profiles')
    .select('org_id')
    .eq('id', user.id)
    .single()

  if (userProfile?.org_id !== orgId) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  // Get all org members
  const { data: orgMembers } = await admin
    .from('profiles')
    .select('id, full_name, avatar_url')
    .eq('org_id', orgId)

  const memberIds = (orgMembers ?? []).map((m) => m.id)
  if (memberIds.length === 0) {
    return NextResponse.json({ success: true, data: { weekly: [], allTime: [] } })
  }

  const nameMap = new Map((orgMembers ?? []).map((m) => [m.id, { name: m.full_name, avatar: m.avatar_url }]))

  // Weekly XP: sum xp_ledger for current week
  const weekStart = new Date()
  weekStart.setHours(0, 0, 0, 0)
  weekStart.setDate(weekStart.getDate() - weekStart.getDay())

  const { data: weeklyXp } = await admin
    .from('xp_ledger')
    .select('user_id, amount')
    .in('user_id', memberIds)
    .gte('created_at', weekStart.toISOString())

  const weeklyByUser = (weeklyXp ?? []).reduce((acc: Record<string, number>, row) => {
    acc[row.user_id] = (acc[row.user_id] ?? 0) + row.amount
    return acc
  }, {})

  // All-time: from learner_profiles
  const { data: allTimeProfiles } = await admin
    .from('learner_profiles')
    .select('user_id, xp_total, scholar_level, scholar_title')
    .in('user_id', memberIds)
    .order('xp_total', { ascending: false })
    .limit(50)

  const weeklyRanked = Object.entries(weeklyByUser)
    .map(([userId, xp]) => ({ userId, xp, ...nameMap.get(userId) }))
    .sort((a, b) => b.xp - a.xp)
    .slice(0, 20)
    .map((e, i) => ({ rank: i + 1, ...e, isCurrentUser: e.userId === user.id }))

  const allTimeRanked = (allTimeProfiles ?? [])
    .map((p, i) => ({
      rank: i + 1,
      userId: p.user_id,
      xp: p.xp_total,
      level: p.scholar_level,
      title: p.scholar_title,
      ...nameMap.get(p.user_id),
      isCurrentUser: p.user_id === user.id,
    }))

  // Ensure current user is always in the list
  const currentUserWeeklyRank = weeklyRanked.find((e) => e.isCurrentUser)
  if (!currentUserWeeklyRank && weeklyByUser[user.id]) {
    const pos = weeklyRanked.findIndex((e) => e.xp < (weeklyByUser[user.id] ?? 0))
    weeklyRanked.push({
      rank: pos >= 0 ? pos + 1 : weeklyRanked.length + 1,
      userId: user.id,
      xp: weeklyByUser[user.id] ?? 0,
      name: nameMap.get(user.id)?.name ?? null,
      avatar: nameMap.get(user.id)?.avatar ?? null,
      isCurrentUser: true,
    })
  }

  return NextResponse.json({
    success: true,
    data: { weekly: weeklyRanked, allTime: allTimeRanked },
  })
}

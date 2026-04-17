/**
 * GET /api/achievements
 * Returns the full achievement catalog with the learner's unlock status.
 */

import { createClient, createAdminClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const admin = createAdminClient()

  const [achievementsRes, unlockedRes] = await Promise.all([
    admin
      .from('achievements')
      .select('id, slug, title, description, flavor_text, icon_key, category, xp_reward, coin_reward, rarity')
      .order('category')
      .order('rarity'),
    admin
      .from('learner_achievements')
      .select('achievement_id, unlocked_at, notified')
      .eq('user_id', user.id),
  ])

  const unlockedMap = new Map(
    (unlockedRes.data ?? []).map((u) => [u.achievement_id, { unlockedAt: u.unlocked_at, notified: u.notified }])
  )

  const achievements = (achievementsRes.data ?? []).map((ach) => {
    const unlock = unlockedMap.get(ach.id)
    return {
      ...ach,
      unlocked: !!unlock,
      unlockedAt: unlock?.unlockedAt ?? null,
      notified: unlock?.notified ?? false,
    }
  })

  const unlockedCount = achievements.filter((a) => a.unlocked).length
  const unnotified = achievements.filter((a) => a.unlocked && !a.notified)

  // Mark unnotified as notified
  if (unnotified.length > 0) {
    const ids = unnotified.map((a) => a.id)
    await admin
      .from('learner_achievements')
      .update({ notified: true })
      .eq('user_id', user.id)
      .in('achievement_id', ids)
  }

  return NextResponse.json({
    success: true,
    data: {
      achievements,
      totalCount: achievements.length,
      unlockedCount,
      newUnlocks: unnotified,
    },
  })
}

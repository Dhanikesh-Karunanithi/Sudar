/**
 * Gamification Engine — central evaluateGamification() function.
 * Called fire-and-forget from /api/events/route.ts after every learning event write.
 * Handles: coin earn, XP earn, level-up, achievement unlocking, quest progress,
 * and org challenge progression.
 */

import { createServiceRoleSupabaseClient } from '@/lib/supabase/server'
import { dispatchUserNotification } from '@/lib/notifications/dispatch'
import { COIN_EARN_RULES, STREAK_MILESTONE_COINS } from './rules'
import { getLevelForXp, SCHOLAR_RANKS } from './types'
import type { GamificationResult } from './types'

interface EngineInput {
  userId: string
  eventType: string
  courseId?: string | null
  moduleId?: string | null
  payload: Record<string, unknown>
  /** Pass the request origin so we can fire internal fetch calls */
  origin?: string
  cookieHeader?: string
  /** Server-only coin override for trusted org KPI milestones */
  trustedServerCoins?: number
}

interface ChallengeProgressRow {
  id: string
  challenge_id: string
  contribution: Record<string, unknown> | null
  completed_at: string | null
}

export async function evaluateGamification(input: EngineInput): Promise<GamificationResult> {
  const { userId, eventType, courseId, moduleId, payload } = input
  const admin = createServiceRoleSupabaseClient()

  // Load current learner_profile (coins, xp, level)
  const { data: profile } = await admin
    .from('learner_profiles')
    .select('coin_balance, xp_total, scholar_level, scholar_title')
    .eq('user_id', userId)
    .single()

  const currentCoins = profile?.coin_balance ?? 0
  const currentXp = profile?.xp_total ?? 0
  const currentLevel = profile?.scholar_level ?? 1

  let coinsToAdd = 0
  let xpToAdd = 0

  // ── Coin + XP earn rules ────────────────────────────────────────────────────
  if (eventType === 'module_complete' && moduleId) {
    const { count } = await admin
      .from('learning_events')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('course_id', courseId ?? '')
      .eq('module_id', moduleId)
      .eq('event_type', 'module_complete')
    if ((count ?? 0) > 1) {
      return {
        coinsEarned: 0,
        xpEarned: 0,
        levelUp: null,
        newAchievements: [],
        newBalance: currentCoins,
        newXp: currentXp,
        newLevel: currentLevel,
      }
    }
  }

  if (eventType === 'streak_milestone_hit') {
    const streakDays = (payload.days as number) ?? 0
    const milestone = STREAK_MILESTONE_COINS[streakDays]
    if (milestone) {
      coinsToAdd = milestone.coins
      xpToAdd = milestone.xp
    }
  } else if (eventType === 'org_kpi_milestone') {
    coinsToAdd = input.trustedServerCoins ?? 0
    xpToAdd = 50
  } else {
    for (const rule of COIN_EARN_RULES) {
      if (rule.eventType !== eventType) continue
      if (rule.condition) {
        const ctx = { userId, courseId, moduleId, payload, streakDays: undefined }
        if (!rule.condition(payload, ctx)) continue
      }

      // Enforce daily limits by counting today's coin_ledger entries
      if (rule.dailyLimit && rule.dailyLimit > 0 && rule.coins > 0) {
        const todayStart = new Date()
        todayStart.setHours(0, 0, 0, 0)
        const { count } = await admin
          .from('coin_ledger')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', userId)
          .eq('event_type', eventType)
          .gte('created_at', todayStart.toISOString())

        if ((count ?? 0) >= rule.dailyLimit) break
      }

      coinsToAdd = rule.coins
      xpToAdd = rule.xp
      break // First matching rule wins
    }
  }

  // ── Apply coins + XP ────────────────────────────────────────────────────────
  const newXp = currentXp + xpToAdd

  // ── Level-up check ──────────────────────────────────────────────────────────
  const { level: newLevel, title: newTitle } = getLevelForXp(newXp)
  let levelUp: GamificationResult['levelUp'] = null
  if (newLevel > currentLevel) {
    levelUp = { from: currentLevel, to: newLevel, newTitle }
    const levelRank = SCHOLAR_RANKS.find((r) => r.level === newLevel)
    if (levelRank?.levelUpCoins) {
      coinsToAdd += levelRank.levelUpCoins
    }
  }
  const finalBalance = currentCoins + coinsToAdd

  // ── Write coin ledger entry (if earned) ─────────────────────────────────────
  if (coinsToAdd > 0) {
    await admin.from('coin_ledger').insert({
      user_id: userId,
      amount: coinsToAdd,
      event_type: eventType,
      balance_after: finalBalance,
      metadata: { courseId, moduleId, payload },
    })
  }

  // ── Write XP ledger entry (if earned) ───────────────────────────────────────
  if (xpToAdd > 0) {
    await admin.from('xp_ledger').insert({
      user_id: userId,
      amount: xpToAdd,
      source_type: eventType,
    })
  }

  // ── Update learner_profiles ─────────────────────────────────────────────────
  if (coinsToAdd > 0 || xpToAdd > 0 || levelUp) {
    const updates: Record<string, unknown> = {}
    if (coinsToAdd > 0) updates.coin_balance = finalBalance
    if (xpToAdd > 0) updates.xp_total = newXp
    if (levelUp) {
      updates.scholar_level = newLevel
      updates.scholar_title = newTitle
    }
    await admin.from('learner_profiles').update(updates).eq('user_id', userId)
  }

  if (levelUp) {
    await admin.from('learning_events').insert({
      user_id: userId,
      course_id: courseId ?? null,
      module_id: moduleId ?? null,
      event_type: 'level_up',
      payload: { from_level: levelUp.from, to_level: levelUp.to, title: levelUp.newTitle },
    })
    await dispatchUserNotification({
      userId,
      category: 'level_up',
      title: `You reached Scholar level ${levelUp.to}`,
      body: `New title: ${levelUp.newTitle}`,
      linkUrl: '/coins',
      metadata: { from_level: levelUp.from, to_level: levelUp.to },
    })
  }

  // ── Achievement evaluation ──────────────────────────────────────────────────
  const newAchievements: GamificationResult['newAchievements'] = []

  const { data: allAchievements } = await admin
    .from('achievements')
    .select('id, slug, title, rarity, xp_reward, coin_reward, trigger_type, trigger_config')
    .eq('trigger_type', eventType)

  const { data: alreadyUnlocked } = await admin
    .from('learner_achievements')
    .select('achievement_id')
    .eq('user_id', userId)

  const unlockedIds = new Set((alreadyUnlocked ?? []).map((a) => a.achievement_id))

  for (const ach of allAchievements ?? []) {
    if (unlockedIds.has(ach.id)) continue

    const config = (ach.trigger_config as Record<string, unknown>) ?? {}
    const unlocked = await checkAchievementCondition(
      ach.trigger_type,
      config,
      { userId, eventType, courseId, moduleId, payload, admin, newXp, newBalance: finalBalance }
    )

    if (!unlocked) continue

    await admin.from('learner_achievements').insert({
      user_id: userId,
      achievement_id: ach.id,
      notified: false,
    })

    // Award achievement coins + XP
    if (ach.coin_reward > 0 || ach.xp_reward > 0) {
      const achBalance = finalBalance + (ach.coin_reward ?? 0)
      if (ach.coin_reward > 0) {
        await admin.from('coin_ledger').insert({
          user_id: userId,
          amount: ach.coin_reward,
          event_type: 'achievement_unlocked',
          balance_after: achBalance,
          metadata: { achievement_slug: ach.slug },
        })
        await admin
          .from('learner_profiles')
          .update({ coin_balance: achBalance })
          .eq('user_id', userId)
      }
      if (ach.xp_reward > 0) {
        await admin.from('xp_ledger').insert({
          user_id: userId,
          amount: ach.xp_reward,
          source_type: 'achievement_unlocked',
        })
        await admin
          .from('learner_profiles')
          .update({ xp_total: newXp + ach.xp_reward })
          .eq('user_id', userId)
      }
    }

    await admin.from('learning_events').insert({
      user_id: userId,
      course_id: courseId ?? null,
      module_id: moduleId ?? null,
      event_type: 'achievement_unlocked',
      payload: { achievement_slug: ach.slug, rarity: ach.rarity },
    })

    newAchievements.push({
      slug: ach.slug,
      title: ach.title,
      rarity: ach.rarity as 'common' | 'rare' | 'epic' | 'legendary',
      coinReward: ach.coin_reward,
      xpReward: ach.xp_reward,
    })

    await dispatchUserNotification({
      userId,
      category: 'achievement',
      title: `Achievement unlocked: ${ach.title}`,
      body:
        ach.coin_reward > 0 || ach.xp_reward > 0
          ? `Rewards: ${ach.coin_reward} coins, ${ach.xp_reward} XP`
          : null,
      linkUrl: '/achievements',
      metadata: { slug: ach.slug, rarity: ach.rarity },
    })
  }

  // ── Quest step progress ─────────────────────────────────────────────────────
  await updateQuestProgress({ userId, eventType, courseId, moduleId, payload, admin })
  await updateOrgChallengeProgress({ userId, eventType, courseId, moduleId, payload, admin })

  return {
    coinsEarned: coinsToAdd,
    xpEarned: xpToAdd,
    levelUp,
    newAchievements,
    newBalance: finalBalance,
    newXp,
    newLevel,
  }
}

// ── Achievement condition checker ─────────────────────────────────────────────

interface ConditionContext {
  userId: string
  eventType: string
  courseId?: string | null
  moduleId?: string | null
  payload: Record<string, unknown>
  admin: ReturnType<typeof createServiceRoleSupabaseClient>
  newXp: number
  newBalance: number
}

async function checkAchievementCondition(
  triggerType: string,
  config: Record<string, unknown>,
  ctx: ConditionContext
): Promise<boolean> {
  const { userId, admin, payload } = ctx

  switch (triggerType) {
    case 'module_complete': {
      if (!config.count) return true
      const { count } = await admin
        .from('learning_events')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('event_type', 'module_complete')
      return (count ?? 0) >= (config.count as number)
    }

    case 'course_complete': {
      if (config.count) {
        const { count } = await admin
          .from('learning_events')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', userId)
          .eq('event_type', 'course_complete')
        return (count ?? 0) >= (config.count as number)
      }
      if (config.max_sessions) {
        return true // Would need session-count tracking per course — stub for now
      }
      if (config.avg_quiz_score) {
        const minScore = config.avg_quiz_score as number
        const { data: quizEvents } = await admin
          .from('learning_events')
          .select('payload')
          .eq('user_id', userId)
          .eq('event_type', 'quiz_attempt')
          .eq('course_id', ctx.courseId ?? '')
        const scores = (quizEvents ?? [])
          .map((e) => (e.payload as Record<string, unknown>)?.score as number)
          .filter((s) => typeof s === 'number')
        if (scores.length === 0) return false
        const avg = scores.reduce((a, b) => a + b, 0) / scores.length
        return avg >= minScore
      }
      return true
    }

    case 'quiz_attempt': {
      const score = payload.score as number
      const isFirst = payload.first_attempt as boolean
      if (config.score && score !== (config.score as number)) return false
      if (config.first_attempt && !isFirst) return false
      if (config.count) {
        const { count } = await admin
          .from('learning_events')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', userId)
          .eq('event_type', 'quiz_attempt')
          .contains('payload', { score: 100, first_attempt: true })
        return (count ?? 0) >= (config.count as number)
      }
      return true
    }

    case 'streak_milestone_hit': {
      const days = payload.days as number
      return days >= (config.days as number)
    }

    case 'checkin_answered': {
      if (!config.count) return true
      const { count } = await admin
        .from('checkin_responses')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', userId)
      return (count ?? 0) >= (config.count as number)
    }

    case 'profile_question_answered': {
      if (config.completeness) {
        const { data: lp } = await admin
          .from('learner_profiles')
          .select('profile_completeness_pct')
          .eq('user_id', userId)
          .single()
        return (lp?.profile_completeness_pct ?? 0) >= (config.completeness as number)
      }
      return true
    }

    case 'course_reflection_submitted': {
      if (!config.count) return true
      const { count } = await admin
        .from('learning_events')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('event_type', 'course_reflection_submitted')
      return (count ?? 0) >= (config.count as number)
    }

    case 'modality_switch': {
      if (config.all_modalities) {
        const { data: events } = await admin
          .from('learning_events')
          .select('modality')
          .eq('user_id', userId)
          .eq('event_type', 'modality_switch')
        const used = new Set((events ?? []).map((e) => e.modality).filter(Boolean))
        return used.size >= 7
      }
      if (config.count) {
        const { count } = await admin
          .from('learning_events')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', userId)
          .eq('event_type', 'modality_switch')
        return (count ?? 0) >= (config.count as number)
      }
      return true
    }

    case 'org_challenge_completed':
      return true

    case 'leaderboard_rank_changed': {
      const rank = payload.rank as number
      if (config.rank_lte) return rank <= (config.rank_lte as number)
      return true
    }

    case 'creator_course_published': {
      if (!config.count) return true
      const { count } = await admin
        .from('learning_events')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('event_type', 'creator_course_published')
      return (count ?? 0) >= (config.count as number)
    }

    default:
      return false
  }
}

// ── Quest step progress updater ───────────────────────────────────────────────

interface QuestProgressInput {
  userId: string
  eventType: string
  courseId?: string | null
  moduleId?: string | null
  payload: Record<string, unknown>
  admin: ReturnType<typeof createServiceRoleSupabaseClient>
}

async function updateQuestProgress(input: QuestProgressInput) {
  const { userId, eventType, payload, courseId, moduleId, admin } = input

  const { data: activeQuests } = await admin
    .from('learner_quests')
    .select('id, quest_id, progress, quests(steps, coin_reward, xp_reward, quest_type, title, slug)')
    .eq('user_id', userId)
    .eq('status', 'active')

  if (!activeQuests?.length) return

  for (const lq of activeQuests) {
    const quest = lq.quests as {
      steps: unknown[]
      coin_reward: number
      xp_reward: number
      quest_type: string
      title?: string
      slug?: string
    } | null
    if (!quest) continue

    const steps = (quest.steps as Array<Record<string, unknown>>) ?? []
    const progress = (lq.progress as Record<string, number>) ?? {}
    let updated = false

    for (const step of steps) {
      const stepId = step.id as string
      if (progress[stepId] !== undefined && progress[stepId] >= (step.target as number ?? 1)) continue
      if (step.event_type !== eventType) continue

      // Check any step-specific conditions
      if (step.modality && payload.modality !== step.modality) continue
      if (step.min_score && (payload.score as number) < (step.min_score as number)) continue
      if (step.score && payload.score !== step.score) continue
      if (step.first_attempt && !payload.first_attempt) continue

      progress[stepId] = (progress[stepId] ?? 0) + 1
      updated = true

      await admin.from('learning_events').insert({
        user_id: userId,
        course_id: courseId ?? null,
        module_id: moduleId ?? null,
        event_type: 'quest_step_completed',
        payload: {
          quest_id: lq.quest_id,
          step_id: stepId,
          progress: progress[stepId],
          target: (step.target as number) ?? 1,
        },
      })
    }

    if (!updated) continue

    const allComplete = steps.every((s) => {
      const sid = s.id as string
      return (progress[sid] ?? 0) >= ((s.target as number) ?? 1)
    })

    await admin
      .from('learner_quests')
      .update({
        progress,
        status: allComplete ? 'completed' : 'active',
        completed_at: allComplete ? new Date().toISOString() : null,
      })
      .eq('id', lq.id)

    // Award quest completion rewards
    if (allComplete) {
      const { data: lp } = await admin
        .from('learner_profiles')
        .select('coin_balance, xp_total')
        .eq('user_id', userId)
        .single()

      const cb = (lp?.coin_balance ?? 0) + quest.coin_reward
      const xt = (lp?.xp_total ?? 0) + quest.xp_reward

      if (quest.coin_reward > 0) {
        await admin.from('coin_ledger').insert({
          user_id: userId,
          amount: quest.coin_reward,
          event_type: 'quest_completed',
          balance_after: cb,
          metadata: { quest_id: lq.quest_id },
        })
        await admin.from('learner_profiles').update({ coin_balance: cb, xp_total: xt }).eq('user_id', userId)
      }

      if (quest.xp_reward > 0) {
        await admin.from('xp_ledger').insert({
          user_id: userId,
          amount: quest.xp_reward,
          source_type: 'quest_completed',
          reference_id: lq.quest_id,
        })
      }

      await admin
        .from('learner_profiles')
        .update({ coin_balance: cb, xp_total: xt })
        .eq('user_id', userId)

      await admin.from('learning_events').insert({
        user_id: userId,
        course_id: courseId ?? null,
        module_id: moduleId ?? null,
        event_type: 'quest_completed',
        payload: { quest_id: lq.quest_id, coin_reward: quest.coin_reward, xp_reward: quest.xp_reward },
      })

      const questTitle = quest.title?.trim() || 'Quest'
      await dispatchUserNotification({
        userId,
        category: 'creator_campaign',
        title: `Quest complete: ${questTitle}`,
        body:
          quest.coin_reward > 0 || quest.xp_reward > 0
            ? `You earned ${quest.coin_reward} coins and ${quest.xp_reward} XP.`
            : null,
        linkUrl: '/coins',
        metadata: { quest_id: lq.quest_id, slug: quest.slug ?? null },
      })
    }
  }
}

interface OrgChallengeInput {
  userId: string
  eventType: string
  courseId?: string | null
  moduleId?: string | null
  payload: Record<string, unknown>
  admin: ReturnType<typeof createServiceRoleSupabaseClient>
}

function asNumber(value: unknown): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : 0
}

async function upsertChallengeProgress(
  admin: ReturnType<typeof createServiceRoleSupabaseClient>,
  challengeId: string,
  userId: string,
  contribution: Record<string, unknown>
): Promise<ChallengeProgressRow | null> {
  const { data: existing } = await admin
    .from('org_challenge_progress')
    .select('id, challenge_id, contribution, completed_at')
    .eq('challenge_id', challengeId)
    .eq('user_id', userId)
    .maybeSingle()

  if (!existing) {
    const { data: created } = await admin
      .from('org_challenge_progress')
      .insert({
        challenge_id: challengeId,
        user_id: userId,
        contribution,
      })
      .select('id, challenge_id, contribution, completed_at')
      .single()
    return (created as ChallengeProgressRow | null) ?? null
  }

  const { data: updated } = await admin
    .from('org_challenge_progress')
    .update({ contribution })
    .eq('id', existing.id)
    .select('id, challenge_id, contribution, completed_at')
    .single()

  return (updated as ChallengeProgressRow | null) ?? null
}

async function maybeCompleteChallenge(
  admin: ReturnType<typeof createServiceRoleSupabaseClient>,
  row: ChallengeProgressRow | null
): Promise<boolean> {
  if (!row || row.completed_at) return false
  const { error } = await admin
    .from('org_challenge_progress')
    .update({ completed_at: new Date().toISOString() })
    .eq('id', row.id)
    .is('completed_at', null)
  return !error
}

async function awardChallengePrize(
  admin: ReturnType<typeof createServiceRoleSupabaseClient>,
  userId: string,
  coinPrize: number,
  challengeId: string
) {
  if (coinPrize <= 0) return
  const { data: lp } = await admin
    .from('learner_profiles')
    .select('coin_balance')
    .eq('user_id', userId)
    .single()

  const newBalance = (lp?.coin_balance ?? 0) + coinPrize
  await admin.from('coin_ledger').insert({
    user_id: userId,
    amount: coinPrize,
    event_type: 'org_challenge_completed',
    balance_after: newBalance,
    metadata: { challenge_id: challengeId },
  })
  await admin.from('learner_profiles').update({ coin_balance: newBalance }).eq('user_id', userId)
}

async function updateOrgChallengeProgress(input: OrgChallengeInput) {
  const { userId, eventType, payload, courseId, moduleId, admin } = input

  const { data: profile } = await admin
    .from('profiles')
    .select('org_id')
    .eq('id', userId)
    .single()
  if (!profile?.org_id) return

  const nowIso = new Date().toISOString()
  const { data: activeChallenges } = await admin
    .from('org_challenges')
    .select('id, challenge_type, target_config, coin_prize, start_at, end_at')
    .eq('org_id', profile.org_id)
    .lte('start_at', nowIso)
    .gte('end_at', nowIso)
  if (!activeChallenges?.length) return

  for (const challenge of activeChallenges) {
    const challengeType = challenge.challenge_type
    const targetConfig = (challenge.target_config as Record<string, unknown>) ?? {}
    let contribution: Record<string, unknown> | null = null
    let userCompleted = false

    if (challengeType === 'individual_completions') {
      const metric = (targetConfig.metric as string) ?? 'module_complete'
      const target = asNumber(targetConfig.target) || 10
      if (eventType !== metric) continue
      const progressRow = await upsertChallengeProgress(admin, challenge.id, userId, {})
      const prevCount = asNumber(progressRow?.contribution?.count)
      contribution = { ...(progressRow?.contribution ?? {}), count: prevCount + 1, metric, target }
      const updated = await upsertChallengeProgress(admin, challenge.id, userId, contribution)
      userCompleted = asNumber((updated?.contribution as Record<string, unknown>)?.count) >= target
      if (userCompleted && await maybeCompleteChallenge(admin, updated)) {
        await awardChallengePrize(admin, userId, challenge.coin_prize ?? 0, challenge.id)
        await admin.from('learning_events').insert({
          user_id: userId,
          course_id: courseId ?? null,
          module_id: moduleId ?? null,
          event_type: 'org_challenge_completed',
          payload: { challenge_id: challenge.id, challenge_type: challengeType },
        })
      }
      continue
    }

    if (challengeType === 'team_total_completions' || challengeType === 'compliance_deadline') {
      const metric = (targetConfig.metric as string) ?? 'module_complete'
      const target = asNumber(targetConfig.target) || 100
      if (eventType !== metric) continue

      const progressRow = await upsertChallengeProgress(admin, challenge.id, userId, {})
      const prevCount = asNumber(progressRow?.contribution?.count)
      contribution = { ...(progressRow?.contribution ?? {}), count: prevCount + 1, metric, target }
      await upsertChallengeProgress(admin, challenge.id, userId, contribution)

      const { data: allRows } = await admin
        .from('org_challenge_progress')
        .select('id, contribution, user_id, completed_at')
        .eq('challenge_id', challenge.id)
      const teamTotal = (allRows ?? []).reduce((sum, row) => sum + asNumber((row.contribution as Record<string, unknown>)?.count), 0)
      if (teamTotal >= target) {
        for (const row of allRows ?? []) {
          if (row.completed_at) continue
          const completed = await maybeCompleteChallenge(admin, {
            id: row.id,
            challenge_id: challenge.id,
            contribution: (row.contribution as Record<string, unknown>) ?? null,
            completed_at: row.completed_at,
          })
          if (completed) {
            await awardChallengePrize(admin, row.user_id, challenge.coin_prize ?? 0, challenge.id)
            await admin.from('learning_events').insert({
              user_id: row.user_id,
              course_id: courseId ?? null,
              module_id: moduleId ?? null,
              event_type: 'org_challenge_completed',
              payload: { challenge_id: challenge.id, challenge_type: challengeType, team_total: teamTotal },
            })
          }
        }
      }
      continue
    }

    if (challengeType === 'streak_leaders') {
      if (eventType !== 'streak_milestone_hit') continue
      const target = asNumber(targetConfig.target) || 7
      const days = asNumber(payload.days)
      if (days <= 0) continue
      const progressRow = await upsertChallengeProgress(admin, challenge.id, userId, {})
      const prevBest = asNumber(progressRow?.contribution?.best_streak)
      contribution = {
        ...(progressRow?.contribution ?? {}),
        best_streak: Math.max(prevBest, days),
        target,
      }
      const updated = await upsertChallengeProgress(admin, challenge.id, userId, contribution)
      userCompleted = asNumber((updated?.contribution as Record<string, unknown>)?.best_streak) >= target
      if (userCompleted && await maybeCompleteChallenge(admin, updated)) {
        await awardChallengePrize(admin, userId, challenge.coin_prize ?? 0, challenge.id)
        await admin.from('learning_events').insert({
          user_id: userId,
          course_id: courseId ?? null,
          module_id: moduleId ?? null,
          event_type: 'org_challenge_completed',
          payload: { challenge_id: challenge.id, challenge_type: challengeType, best_streak: days },
        })
      }
      continue
    }

    if (challengeType === 'quiz_score_avg') {
      if (eventType !== 'quiz_attempt') continue
      const score = asNumber(payload.score)
      if (score <= 0) continue
      const target = asNumber(targetConfig.target) || 90
      const minAttempts = asNumber(targetConfig.min_attempts) || 3
      const progressRow = await upsertChallengeProgress(admin, challenge.id, userId, {})
      const prevSum = asNumber(progressRow?.contribution?.sum)
      const prevCount = asNumber(progressRow?.contribution?.count)
      const nextCount = prevCount + 1
      const nextSum = prevSum + score
      const avg = nextCount > 0 ? nextSum / nextCount : 0
      contribution = {
        ...(progressRow?.contribution ?? {}),
        sum: nextSum,
        count: nextCount,
        avg,
        target,
        min_attempts: minAttempts,
      }
      const updated = await upsertChallengeProgress(admin, challenge.id, userId, contribution)
      const updatedContribution = (updated?.contribution as Record<string, unknown>) ?? {}
      userCompleted =
        asNumber(updatedContribution.count) >= minAttempts &&
        asNumber(updatedContribution.avg) >= target
      if (userCompleted && await maybeCompleteChallenge(admin, updated)) {
        await awardChallengePrize(admin, userId, challenge.coin_prize ?? 0, challenge.id)
        await admin.from('learning_events').insert({
          user_id: userId,
          course_id: courseId ?? null,
          module_id: moduleId ?? null,
          event_type: 'org_challenge_completed',
          payload: { challenge_id: challenge.id, challenge_type: challengeType, avg: updatedContribution.avg },
        })
      }
    }
  }
}

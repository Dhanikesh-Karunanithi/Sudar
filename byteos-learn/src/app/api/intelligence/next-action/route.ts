/**
 * Next Best Action Engine
 *
 * Scores every unenrolled published course against the learner's profile and
 * picks the most relevant recommendation. Stores the result in
 * learner_profiles.next_best_action so the dashboard can display it instantly.
 *
 * Scoring factors (weighted):
 *  - Concept alignment (+): course topics match learner's known_concepts → build on strength
 *  - Gap targeting (+): course topics match learner's struggles_with → close a known gap
 *  - Goal match (+): course title/description matches learner's learning_goals
 *  - Difficulty fit (+): course difficulty matches learner's self-reported level
 *  - Freshness (-): penalise courses that haven't been updated recently
 *  - Peer completion (+): courses completed by many learners in the org (popularity signal)
 *
 * Runs on:  - Dashboard page load (if last computed >4 hours ago)
 *  - After module_complete or quiz_attempt events
 *  - On explicit POST request
 */

import { createClient, createAdminClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { chatCompletion, getChatConfigError } from '@/lib/ai/chat'
import { checkAndIncrementUsage } from '@/lib/usage-limits'

const STALE_HOURS = 4

interface CourseCandidate {
  id: string
  title: string
  description: string | null
  difficulty: string | null
  tags: string[]
  modules: Array<{ title: string }>
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const admin = createAdminClient()
  const usage = await checkAndIncrementUsage(admin, user.id, 'next_action')
  if (!usage.allowed) {
    return NextResponse.json(
      { error: `Daily next-action limit (${usage.limit}) reached. Try again tomorrow.` },
      { status: 429 }
    )
  }

  const body = await request.json().catch(() => ({}))
  const force = body.force === true

  // ── 1. Load learner profile ──────────────────────────────────────────
  const { data: learnerProfile } = await admin
    .from('learner_profiles')
    .select('ai_tutor_context, next_best_action')
    .eq('user_id', user.id)
    .single()

  if (!learnerProfile) return NextResponse.json({ ok: true, skipped: 'no profile' })

  const memory = (learnerProfile.ai_tutor_context as Record<string, unknown>) ?? {}
  const existing = learnerProfile.next_best_action as Record<string, unknown> | null

  // Skip if recently computed and not forced
  if (!force && existing?.computed_at) {
    const ageHours = (Date.now() - new Date(existing.computed_at as string).getTime()) / 3600000
    if (ageHours < STALE_HOURS) return NextResponse.json({ ok: true, skipped: 'fresh', action: existing })
  }

  // ── 2. Load all enrolled course IDs ──────────────────────────────────
  const { data: enrollments } = await admin
    .from('enrollments')
    .select('course_id, status, progress_pct')
    .eq('user_id', user.id)

  const enrolledIds = new Set((enrollments ?? []).map((e) => e.course_id))

  // ── 3. Load all published courses not yet enrolled ────────────────────
  const { data: allCourses } = await admin
    .from('courses')
    .select('id, title, description, difficulty, tags, modules(title)')
    .eq('status', 'published')

  const candidates: CourseCandidate[] = (allCourses ?? []).filter((c) => !enrolledIds.has(c.id))
  if (candidates.length === 0) {
    await admin.from('learner_profiles').update({
      next_best_action: { type: 'all_enrolled', reason: 'You\'ve enrolled in everything — great work!', computed_at: new Date().toISOString() },
    }).eq('user_id', user.id)
    return NextResponse.json({ ok: true })
  }

  // ── 4. Load org peer completion counts ───────────────────────────────
  const { data: peerData } = await admin
    .from('enrollments')
    .select('course_id')
    .eq('status', 'completed')
    .in('course_id', candidates.map((c) => c.id))

  const peerCounts: Record<string, number> = {}
  for (const row of peerData ?? []) {
    peerCounts[row.course_id] = (peerCounts[row.course_id] ?? 0) + 1
  }

  // ── 5. Score each candidate ───────────────────────────────────────────
  const knownConcepts = ((memory.known_concepts as string[]) ?? []).map((s) => s.toLowerCase())
  const struggles = ((memory.struggles_with as string[]) ?? []).map((s) => s.toLowerCase())
  const goals = ((memory.learning_goals as string) ?? '').toLowerCase()
  const background = ((memory.self_reported_background as string) ?? '').toLowerCase()
  const preferredDifficulty = detectDifficultyFromProfile(background, memory)

  const scored = candidates.map((course) => {
    const searchText = [
      course.title,
      course.description ?? '',
      ...(course.tags ?? []),
      ...(course.modules?.map((m) => m.title) ?? []),
    ].join(' ').toLowerCase()

    let score = 0
    const reasons: string[] = []

    // Concept alignment — builds on what they already know
    const conceptMatches = knownConcepts.filter((c) => searchText.includes(c))
    if (conceptMatches.length > 0) {
      score += Math.min(30, conceptMatches.length * 10)
      reasons.push(`builds on concepts you know (${conceptMatches.slice(0, 2).join(', ')})`)
    }

    // Gap targeting — helps with known struggles
    const struggleMatches = struggles.filter((s) => searchText.includes(s))
    if (struggleMatches.length > 0) {
      score += Math.min(40, struggleMatches.length * 15)
      reasons.push(`directly addresses areas you want to improve (${struggleMatches.slice(0, 2).join(', ')})`)
    }

    // Goal alignment
    if (goals) {
      const goalWords = goals.split(/\s+/).filter((w) => w.length > 4)
      const goalMatches = goalWords.filter((w) => searchText.includes(w))
      if (goalMatches.length >= 2) {
        score += 25
        reasons.push('aligns with your stated learning goals')
      }
    }

    // Difficulty fit
    if (course.difficulty && preferredDifficulty) {
      if (course.difficulty === preferredDifficulty) {
        score += 15
        reasons.push(`matches your level (${course.difficulty})`)
      } else if (isDifficultyAdjacent(preferredDifficulty, course.difficulty)) {
        score += 5
      }
    }

    // Peer signal (social proof — people like you completed this)
    const peers = peerCounts[course.id] ?? 0
    if (peers > 0) {
      score += Math.min(10, peers * 2)
    }

    return { course, score, reasons }
  })

  // Sort by score descending
  scored.sort((a, b) => b.score - a.score)
  const best = scored[0]

  if (!best || best.score === 0) {
    // Fall back to most-popular course
    const fallback = candidates.reduce((a, b) => (peerCounts[a.id] ?? 0) > (peerCounts[b.id] ?? 0) ? a : b, candidates[0])
    await admin.from('learner_profiles').update({
      next_best_action: {
        type: 'course',
        course_id: fallback.id,
        course_title: fallback.title,
        reason: 'A highly-rated course in your organisation — a great next step.',
        reasons: [],
        computed_at: new Date().toISOString(),
      },
    }).eq('user_id', user.id)
    return NextResponse.json({ ok: true })
  }

  // ── 6. Generate a personalized reason string with AI ─────────────────
  let reason = best.reasons.length > 0
    ? `This course ${best.reasons[0]}.`
    : `A strong next step based on your learning profile.`

  if (!getChatConfigError() && best.reasons.length > 0) {
    try {
      const prompt = `Write one sentence (max 25 words) explaining to a learner why they should take the course "${best.course.title}" next. Reasons: ${best.reasons.join('; ')}. Be warm and specific. No fluff.`
      const { content: gen } = await chatCompletion({
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 60,
        temperature: 0.6,
      })
      if (gen) reason = gen
    } catch { /* use heuristic reason */ }
  }

  // ── 7. Persist result ─────────────────────────────────────────────────
  const action = {
    type: 'course',
    course_id: best.course.id,
    course_title: best.course.title,
    course_difficulty: best.course.difficulty,
    reason,
    score: best.score,
    computed_at: new Date().toISOString(),
  }

  await admin.from('learner_profiles')
    .update({ next_best_action: action })
    .eq('user_id', user.id)

  return NextResponse.json({ ok: true, action })
}

function detectDifficultyFromProfile(background: string, memory: Record<string, unknown>): string | null {
  const comfort = memory.difficulty_comfort as string
  if (comfort) return comfort
  if (background.includes('senior') || background.includes('expert') || background.includes('lead')) return 'advanced'
  if (background.includes('junior') || background.includes('student') || background.includes('new to')) return 'beginner'
  return 'intermediate'
}

function isDifficultyAdjacent(a: string, b: string): boolean {
  const order = ['beginner', 'intermediate', 'advanced']
  return Math.abs(order.indexOf(a) - order.indexOf(b)) === 1
}

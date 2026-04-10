/**
 * Enrollment Bridge Generator (opt-in personalization)
 *
 * Called when the learner chooses "Personalize this course for me" in the course viewer.
 * Reads memory, goals, and prior courses and generates a short welcome that bridges
 * their context to this course.
 *
 * Output is stored in enrollments.personalized_welcome. Module bodies stay shared;
 * the tutor and path sequencing provide further adaptation.
 */

import { createClient, createAdminClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { chatCompletion, resolveChatConfigError } from '@/lib/ai/chat'
import { loadOrgAiChatContext } from '@/lib/org/orgAiChatContext'
import { checkPersonalizationEligibility } from '@/lib/personalization/eligibility'
import { checkAndIncrementUsage } from '@/lib/usage-limits'

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const admin = createAdminClient()
  const usage = await checkAndIncrementUsage(admin, user.id, 'generic')
  if (!usage.allowed) {
    return NextResponse.json(
      { ok: false, error: `Daily AI limit (${usage.limit}) reached. Try again tomorrow.` },
      { status: 429 }
    )
  }

  let body: { enrollment_id?: string; course_id?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }
  const { enrollment_id, course_id } = body
  if (!enrollment_id || !course_id) {
    return NextResponse.json({ error: 'enrollment_id and course_id required' }, { status: 400 })
  }

  const { data: enc } = await admin
    .from('enrollments')
    .select('id, user_id, course_id')
    .eq('id', enrollment_id)
    .single()
  if (!enc || enc.user_id !== user.id || enc.course_id !== course_id) {
    return NextResponse.json({ error: 'Invalid enrollment' }, { status: 403 })
  }

  const gate = await checkPersonalizationEligibility(admin, {
    userId: user.id,
    courseId: course_id,
    feature: 'course_welcome',
  })
  if (!gate.allowed) {
    return NextResponse.json({ ok: false, error: gate.reason }, { status: 403 })
  }

  const { orgSettings, privateRuntime } = await loadOrgAiChatContext(admin, {
    courseId: course_id,
    userId: user.id,
  })
  const aiCfg = resolveChatConfigError(orgSettings, privateRuntime)
  if (aiCfg) {
    return NextResponse.json(
      { ok: false, error: `Personalization is not available: ${aiCfg}` },
      { status: 503 }
    )
  }
  const chatCtx = { privateOpenAi: privateRuntime }

  // ── Load learner profile and memory ────────────────────────────────
  const [{ data: profile }, { data: learnerProfile }, { data: newCourse }] = await Promise.all([
    admin.from('profiles').select('full_name').eq('id', user.id).single(),
    admin.from('learner_profiles').select('ai_tutor_context, learning_pace, difficulty_comfort').eq('user_id', user.id).single(),
    admin.from('courses').select('title, description, difficulty, modules(title, order_index)').eq('id', course_id).order('order_index', { referencedTable: 'modules', ascending: true }).single(),
  ])

  if (!newCourse) return NextResponse.json({ error: 'Course not found' }, { status: 404 })

  // ── Load prior completed / in-progress enrollments ─────────────────
  const { data: priorEnrollments } = await admin
    .from('enrollments')
    .select('course_id, status, progress_pct')
    .eq('user_id', user.id)
    .neq('course_id', course_id)
    .order('created_at', { ascending: false })
    .limit(5)

  let priorCoursesText = 'None — this may be their first course on the platform.'
  if (priorEnrollments && priorEnrollments.length > 0) {
    const priorIds = priorEnrollments.map((e) => e.course_id).filter(Boolean)
    const { data: priorCourseData } = await admin
      .from('courses')
      .select('id, title')
      .in('id', priorIds)

    priorCoursesText = priorEnrollments.map((e) => {
      const course = priorCourseData?.find((c) => c.id === e.course_id)
      const status = e.status === 'completed' ? '✓ completed' : `${Math.round(e.progress_pct)}% complete`
      return `- "${course?.title ?? 'Unknown course'}" (${status})`
    }).join('\n')
  }

  // ── Build memory summary ────────────────────────────────────────────
  const memory = (learnerProfile?.ai_tutor_context as Record<string, unknown>) ?? {}
  const firstName = profile?.full_name?.split(' ')[0] ?? 'there'

  const knownConcepts = (memory.known_concepts as string[] | undefined) ?? []
  const struggles = (memory.struggles_with as string[] | undefined) ?? []
  const background = (memory.self_reported_background as string) ?? ''
  const goals = (memory.learning_goals as string) ?? ''
  const preferredStyle = (memory.preferred_explanation_style as string) ?? ''

  const moduleTitles = ((newCourse.modules as Array<{ title: string; order_index: number }>) ?? [])
    .sort((a, b) => a.order_index - b.order_index)
    .map((m, i) => `  ${i + 1}. ${m.title}`)
    .join('\n')

  // ── Generate the bridge ─────────────────────────────────────────────
  const prompt = `You are Sudar, a warm and expert AI learning tutor. Generate a personalized enrollment welcome for a learner.

Learner name: ${firstName}
New course: "${newCourse.title}"${newCourse.description ? `\nCourse description: ${newCourse.description}` : ''}
Course modules:
${moduleTitles}

Prior learning history:
${priorCoursesText}

What Sudar knows about this learner:
- Known concepts: ${knownConcepts.length ? knownConcepts.join(', ') : 'none yet'}
- Known struggles: ${struggles.length ? struggles.join(', ') : 'none identified'}
- Background: ${background || 'not provided'}
- Learning goals: ${goals || 'not stated'}
- Preferred style: ${preferredStyle || 'not set'}

Write a short personalized welcome (3–4 sentences max). It should:
1. Greet them by first name warmly
2. Connect their prior knowledge or completed courses to this new course (if relevant) — name specific concepts or prior courses
3. Set an expectation tailored to what you know about them (e.g., what to pay attention to, what will be easy vs challenging)
4. End with one motivating sentence

Write in a warm, human tone. No bullet points. No markdown. Plain text only.
If there's no prior history, make it a genuine warm welcome that references what they've told you about themselves or their goals.`

  let message = ''
  try {
    const { content } = await chatCompletion(
      {
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 300,
        temperature: 0.8,
      },
      chatCtx
    )
    message = content ?? ''
  } catch {
    return NextResponse.json(
      { ok: false, error: 'Could not generate personalization. Try again in a moment.' },
      { status: 502 }
    )
  }

  if (!message.trim()) {
    return NextResponse.json(
      { ok: false, error: 'Personalization returned empty content. Try again.' },
      { status: 502 }
    )
  }

  // ── Build concept bridges ───────────────────────────────────────────
  // Find which known concepts are relevant to the new course modules
  const relevantConcepts = knownConcepts.filter((concept) =>
    moduleTitles.toLowerCase().includes(concept.toLowerCase()) ||
    (newCourse.title + ' ' + (newCourse.description ?? '')).toLowerCase().includes(concept.toLowerCase())
  ).slice(0, 5)

  const welcome = {
    message,
    first_name: firstName,
    course_title: newCourse.title,
    prior_courses: priorEnrollments?.length ?? 0,
    relevant_concepts: relevantConcepts,
    generated_at: new Date().toISOString(),
  }

  // ── Store in the enrollment record ─────────────────────────────────
  await admin
    .from('enrollments')
    .update({ personalized_welcome: welcome })
    .eq('id', enrollment_id)
    .eq('user_id', user.id)

  await admin.from('learning_events').insert({
    user_id: user.id,
    course_id,
    event_type: 'course_personalize',
    payload: { enrollment_id, course_title: newCourse.title },
  })

  return NextResponse.json({ ok: true, welcome })
}

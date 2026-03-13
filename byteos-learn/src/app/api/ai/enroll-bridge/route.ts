/**
 * Enrollment Bridge Generator
 *
 * Called once per enrollment for adaptive courses.
 * Reads the learner's full memory + prior completed courses and generates
 * a personalized welcome that bridges their existing knowledge to this course.
 *
 * Output is stored in enrollments.personalized_welcome and shown once in the viewer.
 */

import { createClient, createAdminClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { chatCompletion, getChatConfigError } from '@/lib/ai/chat'

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (getChatConfigError()) return NextResponse.json({ ok: true }) // fail silently

  const admin = createAdminClient()
  const { enrollment_id, course_id } = await request.json()

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
    const { content } = await chatCompletion({
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 300,
      temperature: 0.8,
    })
    message = content ?? ''
  } catch {
    return NextResponse.json({ ok: true }) // fail silently — enrollment already created
  }

  if (!message) return NextResponse.json({ ok: true })

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

  return NextResponse.json({ ok: true, welcome })
}

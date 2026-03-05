import { createClient, createAdminClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

const TOGETHER_API_URL = 'https://api.together.xyz/v1/chat/completions'

// Allowed tutor models (serverless); set TOGETHER_TUTOR_MODEL in .env.local to override.
const TUTOR_MODELS = [
  { id: 'openai/gpt-oss-20b', label: 'GPT-OSS 20B ($0.05/$0.20 per 1M)' },
  { id: 'LiquidAI/LFM2-24B-A2B', label: 'LFM2-24B-A2B ($0.03/$0.12 per 1M)' },
  { id: 'meta-llama/Llama-3.2-3B-Instruct-Turbo', label: 'Llama 3.2 3B ($0.06 per 1M)' },
  { id: 'meta-llama/Meta-Llama-3-8B-Instruct-Lite', label: 'Llama 3 8B Lite ($0.10 per 1M)' },
  { id: 'openai/gpt-oss-120b', label: 'GPT-OSS 120B ($0.15/$0.60 per 1M)' },
  { id: 'google/gemma-3n-E4B-it', label: 'Gemma 3n E4B ($0.02/$0.04 per 1M)' },
] as const

const DEFAULT_TUTOR_MODEL = 'openai/gpt-oss-20b'
const DEFAULT_MEMORY_MODEL = 'google/gemma-3n-E4B-it'

function getTutorModel(): string {
  const env = process.env.TOGETHER_TUTOR_MODEL?.trim()
  if (env && TUTOR_MODELS.some((m) => m.id === env)) return env
  return DEFAULT_TUTOR_MODEL
}

async function callAI(
  messages: { role: string; content: string }[],
  maxTokens = 600,
  model = getTutorModel()
): Promise<string> {
  const apiKey = process.env.TOGETHER_API_KEY
  if (!apiKey) throw new Error('TOGETHER_API_KEY not set')
  const res = await fetch(TOGETHER_API_URL, {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ model, messages, max_tokens: maxTokens, temperature: 0.7, top_p: 0.9 }),
  })
  const text = await res.text()
  if (!res.ok) throw new Error(text || `AI API ${res.status}`)
  try {
    const data = JSON.parse(text)
    return data.choices?.[0]?.message?.content?.trim() ?? ''
  } catch {
    return ''
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (!process.env.TOGETHER_API_KEY) return NextResponse.json({ error: 'AI tutor not configured' }, { status: 500 })

    let body: { message?: string; course_id?: string; module_id?: string; conversation_history?: unknown[] }
    try {
      body = await request.json()
    } catch {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
    }

    const { message, course_id, module_id, conversation_history = [] } = body
    if (!message?.trim()) return NextResponse.json({ error: 'message required' }, { status: 400 })

    const admin = createAdminClient()

  // ── 1. Load full course context (all modules) ──────────────────────────
  let courseContext = ''
  let courseTitle = ''
  let currentModuleTitle = ''

  if (course_id) {
    const { data: course } = await admin
      .from('courses')
      .select('title, modules(id, title, content, order_index)')
      .eq('id', course_id)
      .order('order_index', { referencedTable: 'modules', ascending: true })
      .single()

    if (course) {
      courseTitle = course.title
      const modules = (course.modules as Array<{ id: string; title: string; content: { body?: string } | null; order_index: number }>) ?? []

      // Build full course context, marking current module prominently
      courseContext = modules.map((m) => {
        const isActive = m.id === module_id
        const body = m.content?.body?.slice(0, 800) ?? ''
        return `${isActive ? '>>> CURRENT MODULE <<<\n' : ''}[Module ${m.order_index + 1}: ${m.title}]\n${body}`
      }).join('\n\n---\n\n')

      // Cap total context at 6000 chars
      if (courseContext.length > 6000) courseContext = courseContext.slice(0, 6000) + '...[truncated]'
      currentModuleTitle = modules.find((m) => m.id === module_id)?.title ?? ''
    }
  }

  // ── 2. Load learner memory + cross-course history ─────────────────────
  const [{ data: learnerProfile, error: learnerError }, { data: priorEnrollments }] = await Promise.all([
    admin
      .from('learner_profiles')
      .select('ai_tutor_context, learning_pace, difficulty_comfort, cognitive_style')
      .eq('user_id', user.id)
      .maybeSingle(),
    admin
      .from('enrollments')
      .select('course_id, status, progress_pct')
      .eq('user_id', user.id)
      .neq('course_id', course_id ?? '')
      .order('created_at', { ascending: false })
      .limit(5),
  ])

  if (learnerError) {
    console.error('[tutor] learner_profiles query error:', learnerError.message)
  }

  // Fetch prior course titles for context
  let priorCoursesText = ''
  if (priorEnrollments && priorEnrollments.length > 0) {
    const priorIds = priorEnrollments.map((e) => e.course_id).filter(Boolean)
    const { data: priorCourses } = await admin.from('courses').select('id, title').in('id', priorIds)
    priorCoursesText = priorEnrollments.map((e) => {
      const c = priorCourses?.find((x) => x.id === e.course_id)
      return `- "${c?.title ?? 'Unknown'}" (${e.status === 'completed' ? 'completed' : `${Math.round(e.progress_pct)}% done`})`
    }).join('\n')
  }

  const memory = learnerProfile?.ai_tutor_context as Record<string, unknown> | null
  const learnerMemoryText = `
Learner Memory (use this to personalize every response):
- Known concepts: ${(memory?.known_concepts as string[] | undefined)?.join(', ') || 'none yet'}
- Struggles with: ${(memory?.struggles_with as string[] | undefined)?.join(', ') || 'none identified'}
- Learning style: ${memory?.learning_style_notes || 'not yet observed'}
- Self-reported background: ${memory?.self_reported_background || 'not provided'}
- Learning goals: ${memory?.learning_goals || 'not stated'}
- Preferred explanation style: ${memory?.preferred_explanation_style || 'not set'}
- Total interactions with Sudar: ${memory?.interaction_count || 0}
${priorCoursesText ? `\nPrior courses on this platform:\n${priorCoursesText}` : ''}`

  // ── 3. Build system prompt ─────────────────────────────────────────────
  const systemPrompt = `You are Sudar, the AI learning tutor for ByteOS Learn. You know this learner deeply.

Personality: warm, concise, encouraging. You celebrate progress and meet people where they are.
Format: plain text only (no markdown, no **, no ##). 2-4 paragraphs max unless detail is genuinely needed.

Current course: "${courseTitle}"
Current module: "${currentModuleTitle}"

${learnerMemoryText}

Full course content (your knowledge base):
---
${courseContext}
---

How to personalize:
- If the learner has a stated preferred explanation style, use it (e.g., examples-first, analogies, step-by-step)
- Reference their background when giving examples — make them relevant to their world
- If they've completed prior courses, connect concepts across courses when helpful
- If they've struggled with something before, give that topic extra care
- Celebrate when they understand something they've previously found hard
- Never skip foundational content — personalize HOW you explain it, not WHETHER
- Start with the direct answer, then explain`

  // ── 4. Build message history ───────────────────────────────────────────
  const messages = [
    { role: 'system', content: systemPrompt },
    ...(Array.isArray(conversation_history) ? conversation_history.slice(-8) : []).map((m: { role?: string; content?: string }) => ({ role: m.role ?? 'user', content: String(m.content ?? '') })),
    { role: 'user', content: message },
  ]

  let aiResponse: string
  try {
    aiResponse = await callAI(messages, 600)
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'AI service error'
    console.error('[tutor] callAI error:', msg)
    return NextResponse.json(
      { error: msg.includes('401') || msg.includes('429') ? 'AI tutor is temporarily unavailable. Please try again later.' : 'Failed to get a response from Sudar. Please try again.' },
      { status: 502 }
    )
  }

  // ── 5. Save interaction (non-blocking; don't fail the request) ───────────
  if (course_id) {
    try {
      await admin.from('ai_interactions').insert({
        user_id: user.id,
        course_id,
        module_id: module_id ?? null,
        interaction_type: 'question',
        user_message: message,
        ai_response: aiResponse,
        context_used: { module_id, course_title: courseTitle, memory_used: !!memory },
      })
    } catch (e) {
      console.error('[tutor] ai_interactions insert error:', e)
    }
    try {
      await admin.from('learning_events').insert({
        user_id: user.id,
        course_id,
        module_id: module_id ?? null,
        event_type: 'ai_tutor_query',
        modality: 'text',
      })
    } catch (e) {
      console.error('[tutor] learning_events insert error:', e)
    }
  }

  // ── 6. Async memory update (fire and forget) ───────────────────────────
  updateLearnerMemory(user.id, message, aiResponse, admin).catch(() => {})

  return NextResponse.json({ response: aiResponse })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error('[tutor] POST error:', msg)
    return NextResponse.json(
      { error: 'Something went wrong. Please try again.' },
      { status: 500 }
    )
  }
}

/**
 * Extracts learner insights from the interaction and updates ai_tutor_context.
 * Only updates AI-observable fields — never modifies user-controlled fields.
 */
async function updateLearnerMemory(
  userId: string,
  userMessage: string,
  aiResponse: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  admin: any
) {
  const { data: profile } = await admin
    .from('learner_profiles')
    .select('ai_tutor_context')
    .eq('user_id', userId)
    .single()

  const existing = (profile?.ai_tutor_context as Record<string, unknown>) ?? {}
  const interactionCount = ((existing.interaction_count as number) ?? 0) + 1

  // Use AI to extract insights from the interaction (lightweight call)
  const extractPrompt = `Analyze this learner interaction and extract JSON insights only if clearly evident.

Learner question: "${userMessage}"
Tutor response summary: "${aiResponse.slice(0, 200)}"

Return a JSON object with ONLY the fields you can confidently infer (omit others):
{
  "new_concept_understood": "concept name if learner clearly understood something" or null,
  "struggle_identified": "topic if learner is clearly confused" or null,
  "style_note": "brief observation about how they learn" or null
}
Return only the JSON, nothing else.`

  try {
    const raw = await fetch('https://api.together.xyz/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.TOGETHER_API_KEY!}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: process.env.TOGETHER_MEMORY_MODEL?.trim() || DEFAULT_MEMORY_MODEL,
        messages: [{ role: 'user', content: extractPrompt }],
        max_tokens: 150,
        temperature: 0.2,
      }),
    })

    if (!raw.ok) return

    const data = await raw.json()
    const content = data.choices?.[0]?.message?.content?.trim()
    const match = content?.match(/\{[\s\S]*\}/)
    if (!match) return

    const insights = JSON.parse(match[0])

    // Merge insights into memory — only append, never overwrite user-editable fields
    const knownConcepts = (existing.known_concepts as string[]) ?? []
    const struggles = (existing.struggles_with as string[]) ?? []

    if (insights.new_concept_understood && !knownConcepts.includes(insights.new_concept_understood)) {
      knownConcepts.push(insights.new_concept_understood)
    }
    if (insights.struggle_identified && !struggles.includes(insights.struggle_identified)) {
      struggles.push(insights.struggle_identified)
    }

    const updatedMemory = {
      ...existing,
      known_concepts: knownConcepts.slice(-20), // keep last 20
      struggles_with: struggles.slice(-10),
      learning_style_notes: insights.style_note || existing.learning_style_notes || '',
      interaction_count: interactionCount,
      last_updated: new Date().toISOString(),
    }

    await admin
      .from('learner_profiles')
      .update({ ai_tutor_context: updatedMemory })
      .eq('user_id', userId)
  } catch {
    // Non-critical — memory update failure should not affect the chat
  }
}

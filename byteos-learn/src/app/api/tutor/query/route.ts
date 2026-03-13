import { createClient, createAdminClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import type { TutorAction, TutorActionType } from '@/types/tutor'
import { TUTOR_ACTION_TYPES } from '@/types/tutor'
import { retrieveChunks } from '@/lib/rag/retrieve'
import { getCachedPublishedCourses, getCachedPublishedPaths } from '@/lib/cache'
import { chatCompletion, getChatConfigError, getDefaultTutorModel, getDefaultMemoryModel } from '@/lib/ai/chat'
const GUARDRAIL_REFUSAL_MESSAGE = "I'm here to help with your courses and learning. I can't help with that. What would you like to learn today?"
const PLATFORM_CONTEXT_CATALOG_LIMIT = 25

// Static, factual description of the Sudar Learn UI — injected into every prompt so Sudar
// can guide navigation accurately instead of hallucinating steps.
const SUDAR_PLATFORM_KNOWLEDGE = `
## Sudar Learn — Platform Navigation Guide (use this when learners ask how to find or access anything)

### Course Viewer Layout
When inside a course, the screen has three areas:
1. **Left sidebar** — collapsible list of all modules with a progress bar. Click any module title to jump to it.
2. **Center content area** — the current module displayed in the chosen modality.
3. **Right panel** — this Sudar chat, opened by clicking the "Ask Sudar" button in the top bar.

### Modality Switcher (icon tabs in the top bar of the course viewer)
The top bar has tabs to switch how content is presented. Each tab has a label and icon:
- **Read** (document icon) — default text/markdown view. Always available immediately.
- **Listen** (headphones icon) — AI-generated audio narration. Click it and it generates in 5–15 seconds on first use; subsequent opens are instant (cached).
- **Map** (network icon) — AI-generated mind map. Generates in a few seconds on first click; cached after that. Has a "Module" vs "Course" scope toggle inside.
- **Cards** (layers icon) — AI-generated flashcards. Always available; click to view.
- **Watch** (video icon) — pre-recorded video. Only active when video was generated in Sudar Studio; otherwise shows "Coming soon" and cannot be clicked.
- **Podcast** (mic icon) — AI dialogue format. Only shown if configured for the course in Studio.

### Key Navigation
- Switch modules: click the module name in the **left sidebar**.
- Open/close Sudar chat: **"Ask Sudar" button** in the top-right of the top bar (or press the chat icon).
- Go to course list: click **"My Courses"** in the left navigation sidebar of the dashboard.
- Highlight any text in the content → a popup appears with quick actions (Explain this, Give me an example, etc.) that auto-send to Sudar.

CRITICAL: When a learner asks how to access a modality, navigate to a module, or use any UI feature, use ONLY the accurate steps above. Do NOT invent navigation steps, menu names, or UI elements that are not described here.`

// Regex patterns that indicate the learner wants an interactive quiz.
const QUIZ_INTENT_PATTERNS = [
  /\b(quiz\s+me|test\s+me)\b/i,
  /\bgive\s+me\s+a\s+(quiz|test|challenge)\b/i,
  /\bchallenge\s+(question|me)\b/i,
  /\bknowledge\s+check\b/i,
  /\bask\s+me\s+a\s+question\b/i,
  /\bquiz\s+question\b/i,
  /\bcan\s+you\s+(quiz|test)\s+me\b/i,
  /\b(another|one\s+more)\s+(quiz|question|challenge)\b/i,
]

function detectsQuizIntent(message: string): boolean {
  return QUIZ_INTENT_PATTERNS.some((p) => p.test(message))
}

// Blocklist: messages containing these (case-insensitive) are refused before calling the model.
const INPUT_BLOCKLIST_PATTERNS = [
  /\bhow\s+to\s+(hack|exploit|cheat|steal|hurt|kill)\b/i,
  /\bwrite\s+(me\s+)?(malware|virus|ransomware)\b/i,
  /\bunethical\s+(request|ask)\b/i,
  /\bignore\s+(all\s+)?(previous|instructions)\b/i,
  /\b(jailbreak|bypass)\s+(safety|guardrails)\b/i,
]

// Questions about Sudar's own identity always pass — no LLM call needed.
const IDENTITY_BYPASS_PATTERNS = [
  /\b(what|who)\s+(is|are)\s+(your|u r|ur)\s+(name|you)\b/i,
  /\bwho\s+are\s+you\b/i,
  /\bwhat('?s|\s+is)\s+your\s+name\b/i,
  /\bintroduce\s+yourself\b/i,
  /\btell\s+me\s+about\s+yourself\b/i,
  /\bwhat\s+can\s+you\s+do\b/i,
  /\bwhat\s+are\s+you\b/i,
  /\byour\s+name\b/i,
  /\bsudar\b/i,
]

// Short conversational follow-ups that are always valid in a learning context.
// These are frequently misclassified by the guardrail LLM because they have no
// standalone learning keywords, yet they are clearly continuations of study sessions.
const FOLLOWUP_BYPASS_PATTERNS = [
  /^(simplif(y|ied)|simpler|simple version|make\s+it\s+simpler)/i,
  /\bin\s+brief\b/i,
  /\bin\s+short\b/i,
  /\bbriefly\b/i,
  /\bsummarise\b|\bsummarize\b/i,
  /\bsummary\b/i,
  /\bshorten\b|\bshorter\b/i,
  /\brepeat\s+that\b|\bsay\s+that\s+again\b|\bonce\s+more\b/i,
  /^(ok|okay|got\s+it|thanks|thank\s+you|great|nice|cool|makes\s+sense|understood)/i,
  /\bexplain\s+(again|more|further|that|this|it)\b/i,
  /\bgive\s+(me\s+)?(an?\s+)?(example|analogy|analogy|demo)\b/i,
  /\bmore\s+(detail|context|depth|info|information|examples?)\b/i,
  /^(what|why|how|when|where|who|which)\s/i,
  /\bwhat\s+does\s+(that|this)\s+mean\b/i,
  /\bi\s+(don'?t\s+)?(understand|get\s+it|follow)\b/i,
  /\bcan\s+you\s+(re)?explain\b/i,
  /\btoo\s+(long|complex|technical|advanced|complicated)\b/i,
  /\beli5\b|\blayman'?s?\s+terms?\b/i,
  /\bnext\b|\bcontinue\b|\bgo\s+on\b|\bproceed\b/i,
]

/** Returns true if the message passes the input guardrail (learning/platform scope). */
async function runInputGuardrail(message: string, hasConversationHistory: boolean): Promise<{ pass: boolean }> {
  const trimmed = message.trim()
  if (!trimmed) return { pass: false }

  for (const pattern of INPUT_BLOCKLIST_PATTERNS) {
    if (pattern.test(trimmed)) return { pass: false }
  }

  // Identity questions about Sudar always pass — no LLM check needed
  for (const pattern of IDENTITY_BYPASS_PATTERNS) {
    if (pattern.test(trimmed)) return { pass: true }
  }

  // Conversational follow-ups always pass — they're context-free by nature but
  // are clearly part of an ongoing learning session
  for (const pattern of FOLLOWUP_BYPASS_PATTERNS) {
    if (pattern.test(trimmed)) return { pass: true }
  }

  // If there's an active conversation, skip the LLM guardrail entirely.
  // The user is already in a learning session; a follow-up message is inherently
  // learning-related regardless of whether it sounds like it in isolation.
  if (hasConversationHistory) return { pass: true }

  if (getChatConfigError()) return { pass: true } // no API key → skip LLM check

  try {
    const { content } = await chatCompletion({
      model: getDefaultMemoryModel(),
      messages: [
        {
          role: 'user',
          content: `Does this message ask for help with learning, courses, studying, questions about the AI tutor, or using this learning platform? Reply with exactly YES or NO.\n\nMessage: "${trimmed.slice(0, 500)}"`,
        },
      ],
      max_tokens: 10,
      temperature: 0,
    })
    const answer = (content ?? '').toUpperCase()
    const pass = !answer.startsWith('NO')
    return { pass }
  } catch {
    return { pass: true } // on error, allow through
  }
}

/** Parse ACTIONS: [...] from the end of the model response; return { text, rawActions }. */
function parseActionsFromResponse(raw: string): { text: string; rawActions: Array<{ type?: string; course_id?: string; path_id?: string; label?: string }> } {
  const actMatch = raw.match(/\nACTIONS:\s*([\s\S]+)$/)
  if (!actMatch) return { text: raw.trim(), rawActions: [] }
  let text = raw.slice(0, actMatch.index).trim()
  text = text.replace(/\n+$/, '')
  let rawActions: Array<{ type?: string; course_id?: string; path_id?: string; label?: string }> = []
  try {
    const parsed = JSON.parse(actMatch[1].trim())
    rawActions = Array.isArray(parsed) ? parsed : []
  } catch {
    rawActions = []
  }
  return { text, rawActions }
}

/** Validate and convert raw actions to TutorAction[]; only allow whitelisted types and valid IDs. */
function validateActions(
  rawActions: Array<{ type?: string; course_id?: string; path_id?: string; label?: string }>,
  allowedCourseIds: Set<string>,
  allowedPathIds: Set<string>,
  enrollmentByCourseId: Map<string, { status: string; progress_pct: number }>
): TutorAction[] {
  const out: TutorAction[] = []
  for (const a of rawActions) {
    const type = (a.type ?? '').trim()
    if (!TUTOR_ACTION_TYPES.includes(type as TutorActionType)) continue
    if (type === 'open_course' && a.course_id) {
      if (!allowedCourseIds.has(a.course_id)) continue
      const enrollment = enrollmentByCourseId.get(a.course_id)
      const href =
        enrollment && enrollment.status !== 'completed'
          ? `/courses/${a.course_id}/learn`
          : `/courses/${a.course_id}`
      const defaultLabel = !enrollment
        ? 'Enroll'
        : enrollment.status === 'completed'
          ? 'Review course'
          : 'Continue'
      const label = (a.label ?? defaultLabel).trim().slice(0, 80) || defaultLabel
      out.push({ type: 'open_course', label, href, course_id: a.course_id })
    } else if (type === 'open_path' && a.path_id) {
      if (!allowedPathIds.has(a.path_id)) continue
      const pathLabel = (a.label ?? 'Open path').trim().slice(0, 80) || 'Open path'
      out.push({ type: 'open_path', label: pathLabel, href: `/paths/${a.path_id}`, path_id: a.path_id })
    }
  }
  return out
}

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
  return getDefaultTutorModel()
}

async function callAI(
  messages: { role: string; content: string }[],
  maxTokens = 600,
  model = getTutorModel()
): Promise<string> {
  const { content } = await chatCompletion({
    messages: messages as { role: 'system' | 'user' | 'assistant'; content: string }[],
    model,
    max_tokens: maxTokens,
    temperature: 0.7,
    top_p: 0.9,
  })
  return content ?? ''
}

/**
 * Generates a single multiple-choice quiz question grounded in the course/module content.
 * Returns null if generation fails (graceful degradation to text-only response).
 */
async function generateQuizBlock(
  courseContent: string,
  moduleTitle: string,
  conversationContext: string,
): Promise<{ question: string; options: Array<{ id: string; text: string; correct: boolean; explanation: string }>; topic: string; difficulty: 'recall' | 'application' | 'challenge' } | null> {
  if (getChatConfigError()) return null

  const difficultyHint = /challenge|harder|harder question|push me|more difficult/i.test(conversationContext)
    ? 'challenge'
    : /appl(y|ication)|real.world|scenario|practical/i.test(conversationContext)
      ? 'application'
      : 'recall'

  const prompt = `You are generating a quiz question for a learner. Use ONLY the provided course content as your knowledge source.

Module: "${moduleTitle}"
Course content excerpt:
---
${courseContent.slice(0, 3000)}
---
Conversation context (for difficulty calibration): "${conversationContext.slice(0, 300)}"
Requested difficulty: ${difficultyHint}

Generate ONE multiple-choice question with exactly 4 options (A, B, C, D). Exactly one option must be correct.

Respond with ONLY valid JSON in this exact shape (no markdown, no extra text):
{
  "topic": "<the specific concept being tested>",
  "difficulty": "${difficultyHint}",
  "question": "<clear, specific question>",
  "options": [
    { "id": "a", "text": "<option A text>", "correct": false, "explanation": "<why this is wrong or why this is right>" },
    { "id": "b", "text": "<option B text>", "correct": true, "explanation": "<why this is the correct answer>" },
    { "id": "c", "text": "<option C text>", "correct": false, "explanation": "<why this is wrong>" },
    { "id": "d", "text": "<option D text>", "correct": false, "explanation": "<why this is wrong>" }
  ]
}

Rules:
- The correct option can be any of a/b/c/d — vary it, do not always use "b".
- Explanations must be concise (1–2 sentences).
- Options must be plausible distractors based on the actual content — no trick questions.
- Return ONLY the JSON object. No other text.`

  try {
    const { content: raw } = await chatCompletion({
      model: getDefaultMemoryModel(),
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 600,
      temperature: 0.5,
    })
    if (!raw) return null
    const match = raw.match(/\{[\s\S]*\}/)
    if (!match) return null
    const parsed = JSON.parse(match[0])
    if (
      typeof parsed.question !== 'string' ||
      !Array.isArray(parsed.options) ||
      parsed.options.length !== 4 ||
      !parsed.options.some((o: { correct?: boolean }) => o.correct === true)
    ) return null
    return parsed
  } catch {
    return null
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (!process.env.TOGETHER_API_KEY) return NextResponse.json({ error: 'AI tutor not configured' }, { status: 500 })

    let body: {
      message?: string
      course_id?: string
      module_id?: string
      conversation_history?: unknown[]
      pasted_text?: string
      selected_text?: string
      active_modality?: string
      available_modalities?: {
        video?: boolean
        podcast?: boolean
        audio_generated?: boolean
        mindmap_generated?: boolean
      }
    }
    try {
      body = await request.json()
    } catch {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
    }

    const { message, course_id, module_id, conversation_history = [], pasted_text, selected_text, active_modality, available_modalities } = body
    if (!message?.trim()) return NextResponse.json({ error: 'message required' }, { status: 400 })

    // ── Input guardrail: refuse off-topic / harmful requests ─────────────────
    const hasConversationHistory = Array.isArray(conversation_history) && conversation_history.length > 0
    const guardrail = await runInputGuardrail(message, hasConversationHistory)
    if (!guardrail.pass) {
      return NextResponse.json(
        { response: GUARDRAIL_REFUSAL_MESSAGE, guardrail_refused: true },
        { status: 200 }
      )
    }

    const pastedText = (typeof pasted_text === 'string' ? pasted_text : '').trim().slice(0, 15000)
    const wantsWorkflow =
      pastedText.length > 0 &&
      /summarize|extract|key\s+terms|outline|bullet\s+points/i.test(message)
    if (wantsWorkflow && pastedText) {
      const workflowType = /extract|key\s+terms/i.test(message) ? 'extract_terms' : 'summarize'
      const baseUrl = request.nextUrl.origin
      try {
        const wfRes = await fetch(`${baseUrl}/api/tutor/workflow`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Cookie: request.headers.get('cookie') ?? '' },
          body: JSON.stringify({ type: workflowType, text: pastedText }),
        })
        const wf = await wfRes.json()
        const blocks: Array<{ id: string; type: 'workflow_status' | 'text'; payload: Record<string, unknown> }> = [
          {
            id: 'wf-1',
            type: 'workflow_status',
            payload: {
              workflow_id: wf.workflow_id,
              name: workflowType === 'extract_terms' ? 'Extract key terms' : 'Summarize',
              steps: wf.steps ?? [],
              current_step_index: wf.current_step_index ?? 0,
              status: wf.status ?? 'done',
              summary: wf.summary,
            },
          },
        ]
        if (wf.result) {
          blocks.push({ id: 'text-result', type: 'text', payload: { content: wf.result } })
        }
        return NextResponse.json({
          response: wf.result ?? wf.summary ?? 'Done.',
          blocks,
        })
      } catch {
        return NextResponse.json({
          response: "I couldn't run that analysis. Please try again.",
          blocks: [],
        })
      }
    }

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
      const modules = (course.modules as Array<{
        id: string
        title: string
        content: { type?: string; body?: string; scorm_text_content?: string } | null
        order_index: number
      }>) ?? []

      // Build full course context, marking current module prominently.
      // For SCORM modules, use the extracted scorm_text_content as the knowledge base.
      // Give the active module up to 4 000 chars; others up to 400 chars each.
      courseContext = modules.map((m) => {
        const isActive = m.id === module_id
        const limit = isActive ? 4000 : 400

        let body = ''
        if (m.content?.type === 'scorm') {
          body = (m.content.scorm_text_content ?? '').slice(0, limit)
          if (!body) body = '[SCORM interactive module — learner is currently interacting with the content]'
        } else {
          body = (m.content?.body ?? '').slice(0, limit)
        }

        const prefix = isActive ? '>>> CURRENT MODULE (learner is here now) <<<\n' : ''
        const typeTag = m.content?.type === 'scorm' ? ' [SCORM]' : ''
        return `${prefix}[Module ${m.order_index + 1}: ${m.title}${typeTag}]\n${body}`
      }).join('\n\n---\n\n')

      // Cap total context at 8 000 chars (SCORM modules need more headroom)
      if (courseContext.length > 8000) courseContext = courseContext.slice(0, 8000) + '...[truncated]'
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

  // ── 2b. When no course_id (e.g. floating chat): load platform context for catalog search & actions ──
  let platformContextText = ''
  const allowedCourseIds = new Set<string>()
  const allowedPathIds = new Set<string>()
  const enrollmentByCourseId = new Map<string, { status: string; progress_pct: number }>()

  if (!course_id) {
    const [allCourses, pathList, enrollmentsRes, ragChunks] = await Promise.all([
      getCachedPublishedCourses(),
      getCachedPublishedPaths(),
      admin.from('enrollments').select('course_id, status, progress_pct').eq('user_id', user.id),
      retrieveChunks(message, { limit: 10 }),
    ])
    const catalogCourses = allCourses.slice(0, PLATFORM_CONTEXT_CATALOG_LIMIT)
    const paths = pathList.map((p) => ({ id: p.id }))
    const allEnrollments = enrollmentsRes.data

    catalogCourses?.forEach((c) => allowedCourseIds.add(c.id))
    paths?.forEach((p) => allowedPathIds.add(p.id))
    allEnrollments?.forEach((e) => {
      if (e.course_id) enrollmentByCourseId.set(e.course_id, { status: e.status, progress_pct: e.progress_pct ?? 0 })
    })

    const catalogLines =
      catalogCourses?.map(
        (c) =>
          `- [${c.id}] ${c.title} — ${(c.description ?? '').slice(0, 200)} (difficulty: ${c.difficulty ?? 'any'}, tags: ${(c.tags as string[])?.join(', ') ?? 'none'})`
      ) ?? []
    const enrollmentLines = Array.from(enrollmentByCourseId.entries()).map(
      ([cid, e]) => `  ${cid} → ${e.status}, ${Math.round(e.progress_pct)}%`
    )
    const ragSection =
      ragChunks.length > 0
        ? `Retrieved relevant courses (use these to match the learner's question; prefer these when answering):\n${ragChunks
            .map(
              (ch) =>
                `- [${ch.course_id}] ${ch.content.slice(0, 400)}${ch.content.length > 400 ? '…' : ''}`
            )
            .join('\n\n')}\n\n`
        : ''
    platformContextText = `
Platform context (use this when the learner asks about courses or paths):
${ragSection}Available courses (id, title, description, difficulty, tags):
${catalogLines.join('\n')}

Learner's enrollments (course_id → status, progress_pct):
${enrollmentLines.length ? enrollmentLines.join('\n') : '  (none)'}

When the learner asks about courses (e.g. "Are there any courses on X?", "Recommend something for Y"), always:
1. Recommend the best-matching course from the list above and give a one-sentence summary.
2. State their relationship to it: not enrolled / in progress X% / completed. Optionally add "Need help with this course?" if relevant.
3. Always append an ACTIONS line so the learner gets a quick-access button. Use these labels: if not enrolled use "Enroll" or "View course"; if in progress use "Continue" or "Continue where you left off"; if completed use "Review course".
Format: ACTIONS: [{"type":"open_course","course_id":"<uuid>","label":"Enroll"}] (or "Continue", "Review course", etc.). Use the exact course id from the list above.
When suggesting a learning path, append: ACTIONS: [{"type":"open_path","path_id":"<uuid>","label":"Open path"}].`
  }

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

  // Last tutor action outcomes (for agent to learn from)
  const { data: outcomeEvents } = await admin
    .from('learning_events')
    .select('payload, course_id, created_at')
    .eq('user_id', user.id)
    .eq('event_type', 'tutor_action_taken')
    .order('created_at', { ascending: false })
    .limit(5)
  const outcomeLines =
    outcomeEvents?.map((e) => {
      const p = (e.payload as { action_label?: string; path_id?: string }) ?? {}
      const label = p.action_label ?? 'clicked'
      return e.course_id ? `- ${label} on course ${e.course_id}` : `- ${label} on path ${p.path_id ?? 'unknown'}`
    }) ?? []
  const outcomesText = outcomeLines.length > 0 ? `\nLast tutor actions taken:\n${outcomeLines.join('\n')}` : ''

  const memory = learnerProfile?.ai_tutor_context as Record<string, unknown> | null
  const storedResponseLength = (memory?.preferred_response_length as string) || 'concise'

  // If the learner explicitly asks for detail in this message, override the stored preference.
  // This allows "explain in detail" to work even when one-line answers is saved as the preference.
  const userWantsDetail = /\b(in detail|in more detail|elaborate|explain more|tell me more|give me more|expand|more about|comprehensive|step by step|step-by-step|walk me through|break it down|full explanation|thoroughly|eli5|explain like|summarize|summary|overview)\b/i.test(message)
  const preferredResponseLength = (userWantsDetail && storedResponseLength === 'one_line') ? 'detailed' : storedResponseLength

  const learnerMemoryText = `
Learner Memory (use this to personalize every response):
- Known concepts: ${(memory?.known_concepts as string[] | undefined)?.join(', ') || 'none yet'}
- Struggles with: ${(memory?.struggles_with as string[] | undefined)?.join(', ') || 'none identified'}
- Learning style: ${memory?.learning_style_notes || 'not yet observed'}
- Self-reported background: ${memory?.self_reported_background || 'not provided'}
- Learning goals: ${memory?.learning_goals || 'not stated'}
- Preferred explanation style: ${memory?.preferred_explanation_style || 'not set'}
- Preferred response length: ${preferredResponseLength}
- Total interactions with Sudar: ${memory?.interaction_count || 0}
${priorCoursesText ? `\nPrior courses on this platform:\n${priorCoursesText}` : ''}${outcomesText}`

  // ── 3. Build system prompt ─────────────────────────────────────────────
  const responseLengthRule =
    preferredResponseLength === 'one_line'
      ? 'Always answer in one short line unless the learner explicitly asks for more.'
      : preferredResponseLength === 'detailed'
        ? 'Give thorough, structured answers with examples when useful. Use line breaks and bullet points for readability.'
        : 'Keep responses concise and brief by default. Use 1–3 short sentences unless the user explicitly asks for more detail or elaboration. Only then give longer, structured answers.'

  const selectedText = (typeof selected_text === 'string' ? selected_text : '').trim().slice(0, 6000)
  const selectedContentBlock = selectedText
    ? `

SELECTED CONTENT (the learner has highlighted this on the screen — their question refers to it; use it as the primary focus of your answer):
---
${selectedText}
---
`
    : ''

  // Build live modality context (only when inside a course)
  let modalityContextText = ''
  if (course_id) {
    const MODALITY_LABELS: Record<string, string> = {
      text: 'Read',
      audio: 'Listen',
      mindmap: 'Map',
      flashcards: 'Cards',
      video: 'Watch',
      podcast: 'Podcast',
    }
    const activeLabel = active_modality ? (MODALITY_LABELS[active_modality] ?? active_modality) : 'Read'
    const av = available_modalities ?? {}

    const modalityLines = [
      `Read ✓ (always available)`,
      av.audio_generated
        ? `Listen ✓ (audio already generated — available instantly)`
        : `Listen ✓ (will AI-generate in ~10 seconds on first click)`,
      av.mindmap_generated
        ? `Map ✓ (mind map already generated — available instantly)`
        : `Map ✓ (will AI-generate in a few seconds on first click)`,
      `Cards ✓ (always available)`,
      av.video ? `Watch ✓ (video is available for this course)` : `Watch ✗ (not enabled — shows "Coming soon")`,
      av.podcast ? `Podcast ✓ (available for this course)` : null,
    ].filter(Boolean)

    modalityContextText = `
Current modality (what the learner is viewing right now): **${activeLabel}**
Available modalities for this course:
${modalityLines.map((l) => `- ${l}`).join('\n')}
When the learner asks how to switch modality or where to find one, refer to the platform navigation guide above.`
  }

  const systemPrompt = `You are **Sudar**, the AI learning tutor built into Sudar Learn. Your name is Sudar — always.
When asked "who are you?", "what is your name?", "what are you?", or any similar identity question, always respond: "I'm **Sudar**, your AI learning tutor on Sudar Learn. I'm here to help you learn, recommend courses, track your progress, and answer any questions about your studies."
Never say you don't have a name. Never refuse to introduce yourself. Identity questions are always welcome.

You only assist with learning and platform use. If the user asks for something off-topic, illegal, or unethical, politely decline and redirect to learning.

Personality: warm, enthusiastic, encouraging. You love the subject matter and make it feel alive. You celebrate progress and meet people where they are.
${responseLengthRule}

Formatting & Engagement (always apply):
- Use **bold** for key terms, *italic* for emphasis or analogies, and \`code\` for technical snippets.
- Use ### headings to break up longer answers into scannable sections.
- Use bullet lists (- item) or numbered lists for steps, comparisons, or multiple points.
- Use relatable real-world analogies and concrete examples — make abstract ideas tangible.
- For longer explanations, end with a short follow-up nudge like "Want me to go deeper on any part?" or a quick question to check understanding.
- Never dump a wall of prose. Even short answers should be well-structured and easy to skim.

Reasoning: When answering, think step by step (what did they ask → what context is relevant → best answer/action), then give your direct answer. Use the course content and learner context below to personalize every response.
${SUDAR_PLATFORM_KNOWLEDGE}

Current course: "${courseTitle}"
Current module: "${currentModuleTitle}"
${selectedContentBlock}
${learnerMemoryText}
${modalityContextText}
${platformContextText}

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
  // Future: multi-turn tool loop — LLM returns tool_calls (e.g. search_courses, get_learner_context);
  // server runs tools, appends results to messages, re-calls LLM until final answer.
  const messages = [
    { role: 'system', content: systemPrompt },
    ...(Array.isArray(conversation_history) ? conversation_history.slice(-8) : []).map((m: { role?: string; content?: string }) => ({ role: m.role ?? 'user', content: String(m.content ?? '') })),
    { role: 'user', content: message },
  ]

  const maxTokens = preferredResponseLength === 'one_line' ? 150 : preferredResponseLength === 'detailed' ? 1400 : 600

  let aiResponse: string
  try {
    aiResponse = await callAI(messages, maxTokens)
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'AI service error'
    console.error('[tutor] callAI error:', msg)
    return NextResponse.json(
      { error: msg.includes('401') || msg.includes('429') ? 'AI tutor is temporarily unavailable. Please try again later.' : 'Failed to get a response from Sudar. Please try again.' },
      { status: 502 }
    )
  }

  // ── Parse and validate ACTIONS from response (output guardrail) ─────────
  const { text: responseText, rawActions } = parseActionsFromResponse(aiResponse)
  const actions = validateActions(rawActions, allowedCourseIds, allowedPathIds, enrollmentByCourseId)

  // #region agent log
  const _logPayload = {
    sessionId: 'a39da6',
    location: 'route.ts:tutor-response',
    message: 'tutor_response',
    data: {
      maxTokens,
      preferredResponseLength,
      responseLengthChars: aiResponse.length,
      responseTextLengthChars: responseText.length,
      endsWithPeriod: /[.!?]\s*$/.test(responseText.trim()),
      last50: responseText.slice(-50),
    },
    timestamp: Date.now(),
    hypothesisId: 'A',
  }
  try {
    await fetch('http://127.0.0.1:7701/ingest/4305abd0-a887-4162-9fa9-777888adc8ea', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Debug-Session-Id': 'a39da6' },
      body: JSON.stringify(_logPayload),
    })
  } catch { /* ignore */ }
  // #endregion

  // ── 5. Save interaction (non-blocking; don't fail the request) ───────────
  if (course_id) {
    try {
      await admin.from('ai_interactions').insert({
        user_id: user.id,
        course_id,
        module_id: module_id ?? null,
        interaction_type: 'question',
        user_message: message,
        ai_response: responseText,
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
  updateLearnerMemory(user.id, message, responseText, admin).catch(() => {})

  // ── 7. Quiz block (if quiz intent detected) ───────────────────────────
  let quizBlock: { id: string; type: 'quiz'; payload: Record<string, unknown> } | null = null
  if (detectsQuizIntent(message)) {
    const conversationContext = Array.isArray(conversation_history)
      ? conversation_history.slice(-4).map((m: { content?: string }) => String(m.content ?? '')).join(' ')
      : ''
    const quizData = await generateQuizBlock(courseContext, currentModuleTitle, conversationContext)
    if (quizData) {
      quizBlock = { id: 'quiz-1', type: 'quiz', payload: quizData as unknown as Record<string, unknown> }
    }
  }

  const blocks: Array<{ id: string; type: string; payload: Record<string, unknown> }> = [
    { id: 'text-1', type: 'text', payload: { content: responseText } },
  ]
  if (actions.length > 0) blocks.push({ id: 'actions-1', type: 'action_group', payload: { actions } })
  if (quizBlock) blocks.push(quizBlock)

  return NextResponse.json({
    response: responseText,
    ...(actions.length > 0 ? { actions } : {}),
    blocks,
  })
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
    const { content } = await chatCompletion({
      model: getDefaultMemoryModel(),
      messages: [{ role: 'user', content: extractPrompt }],
      max_tokens: 150,
      temperature: 0.2,
    })
    const match = (content ?? '').match(/\{[\s\S]*\}/)
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

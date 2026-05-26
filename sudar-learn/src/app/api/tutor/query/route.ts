import { createServiceRoleSupabaseClient } from '@/lib/supabase/server'
import { getRequestSession } from '@/lib/auth/requestSession'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import type { TutorAction, TutorActionType, TutorBlock } from '@/types/tutor'
import { TUTOR_ACTION_TYPES } from '@/types/tutor'
import { retrieveChunks } from '@/lib/rag/retrieve'
import { getCachedPublishedCourses, getCachedPublishedPaths } from '@/lib/cache'
import {
  chatCompletion,
  getDefaultTutorModel,
  getDefaultMemoryModel,
  resolveChatConfigError,
} from '@/lib/ai/chat'
import { loadOrgAiChatContext } from '@/lib/org/orgAiChatContext'
import type { PrivateOpenAiRuntime } from '@/types/orgAiInference'
import { capabilitySupported, parseOrgAiRuntimePolicy } from '@/types/orgAiInference'
import { checkAndIncrementUsage } from '@/lib/usage-limits'
import { logAiError } from '@/lib/logger'
import {
  applyStrictOutputRedaction,
  redactEchoedSensitiveDigits,
  scanSensitiveUserText,
} from '@/lib/security/sensitiveInputGuard'
import { parseOrgAiCompliance, type OrgAiCompliance } from '@/types/personalization'
import { effectivePedagogy, resolveLearnerPreferences } from '@/lib/learner/learnerPreferences'
import { buildTutorContentLanguageBlock } from '@/lib/i18n/contentLanguagePrompt'
import {
  clampOrgTutorMemoryMinIntervalHours,
  clampTutorLlmMemoryExtractionPolicy,
  shouldRunTutorMemoryLlmExtraction,
} from '@/lib/learner/tutorMemoryCadence'
import { buildStruggleSignalsSummary } from '@/lib/learner/struggleSignals'
import { loadSkillGapSummary, recordMasteredTopics, recordStruggleTopics } from '@/lib/learner/syncTopicSkills'
import { parseTutorModelOutput } from '@/lib/tutor/responseContract'
import { sanitizeTutorBlocks } from '@/lib/tutor/tutorBlockSanitize'
import { runTutorInputGuardrail, type TutorGuardrailAiDeps } from '@/lib/tutor/runInputGuardrail'
import { buildTutorActionAllowlists } from '@/lib/tutor/tutorActionAllowlists'
import {
  detectsTutorResourceIntent,
  searchImagesForTutor,
  searchWebForTutor,
} from '@/lib/tutor/webResources'
import { SUDAR_LEARN_PLATFORM_KNOWLEDGE } from '@/content/learnPlatformKnowledge.generated'
const GUARDRAIL_REFUSAL_MESSAGE = "I'm here to help with your courses and learning. I can't help with that. What would you like to learn today?"
const SENSITIVE_DATA_REFUSAL_MESSAGE = (
  "I'm here to help with learning. I can't process payment card numbers, government ID numbers, bank details, or private keys in chat. Remove sensitive details and ask again."
)
const PLATFORM_CONTEXT_CATALOG_LIMIT = 25
const MAX_TUTOR_MESSAGE_LENGTH = 2000
const tutorQueryBodySchema = z.object({
  message: z.string().min(1).max(MAX_TUTOR_MESSAGE_LENGTH),
  course_id: z.string().uuid().optional(),
  module_id: z.string().uuid().optional(),
  conversation_history: z.array(z.object({ role: z.string().optional(), content: z.string().optional() })).optional(),
  pasted_text: z.string().optional(),
  selected_text: z.string().optional(),
  active_modality: z.string().optional(),
  available_modalities: z
    .object({
      video: z.boolean().optional(),
      podcast: z.boolean().optional(),
      audio_generated: z.boolean().optional(),
      mindmap_generated: z.boolean().optional(),
    })
    .optional(),
  route: z.string().optional(),
  pedagogy_mode: z.enum(['explain', 'guide', 'exam_focus']).optional(),
})

type TutorAiDeps = TutorGuardrailAiDeps

function resolveRoutingMeta(orgSettings: unknown, privateRuntime: PrivateOpenAiRuntime | null) {
  const policy = parseOrgAiRuntimePolicy(orgSettings)
  const hasLocalCapability = capabilitySupported(policy, 'chat')
  const localChosen = Boolean(privateRuntime) && hasLocalCapability
  if (localChosen) {
    return {
      decision: 'local' as const,
      provider_id: 'local-main',
      model: privateRuntime?.defaultModel ?? '',
      fallback_used: false,
      fallback_reason: null,
    }
  }
  const fallbackReason =
    policy.mode !== 'cloud' && !hasLocalCapability ? 'LOCAL_CAPABILITY_UNSUPPORTED' : null
  return {
    decision: 'cloud' as const,
    provider_id: 'cloud:default',
    model: process.env.AI_CHAT_DEFAULT_MODEL?.trim() || 'default',
    fallback_used: Boolean(fallbackReason),
    fallback_reason: fallbackReason,
  }
}

/** Navigation truth for learner tutor prompts — regenerated from help-center/_ai/learn-navigation.md */
const SUDAR_PLATFORM_KNOWLEDGE = SUDAR_LEARN_PLATFORM_KNOWLEDGE

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

function isTutorWebEnrichmentEnabled(org: OrgAiCompliance): boolean {
  if (org.tutor_web_enrichment_enabled === false) return false
  if (org.tutor_web_enrichment_enabled === true) return true
  return process.env.TUTOR_WEB_ENRICHMENT_ENABLED === 'true'
}

/**
 * When org/env allows and the learner’s message asks for web/images, attach cited resource cards.
 */
async function buildTutorResourceBlocks(
  org: OrgAiCompliance,
  userMessage: string,
  courseTitle: string,
  moduleTitle: string,
): Promise<TutorBlock[]> {
  if (!isTutorWebEnrichmentEnabled(org)) return []
  if (!detectsTutorResourceIntent(userMessage)) return []
  const q = [moduleTitle, courseTitle, userMessage].filter(Boolean).join(' ').trim().slice(0, 200)
  if (q.length < 4) return []
  const [web, images] = await Promise.all([searchWebForTutor(q, 1), searchImagesForTutor(q, 1)])
  const raw: TutorBlock[] = []
  if (images[0]) {
    raw.push({
      id: 'tutor-res-image',
      type: 'media_card',
      payload: {
        title: `Image: ${moduleTitle || courseTitle || 'Topic'}`.slice(0, 200),
        image_url: images[0].url,
        link_url: images[0].url,
        snippet: images[0].alt,
        attribution: images[0].attribution,
        source_label: 'Image search (verify with your course)',
      },
    })
  }
  if (web[0]) {
    raw.push({
      id: 'tutor-res-web',
      type: 'media_card',
      payload: {
        title: web[0].title.slice(0, 200),
        snippet: web[0].snippet,
        link_url: web[0].link,
        source_label: 'Web result',
        attribution: 'Cross-check with your module; web results may be incomplete.',
      },
    })
  }
  return sanitizeTutorBlocks(raw)
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

function getTutorModel(privateRuntime: PrivateOpenAiRuntime | null): string {
  if (privateRuntime) return privateRuntime.defaultModel
  const env = process.env.TOGETHER_TUTOR_MODEL?.trim()
  if (env && TUTOR_MODELS.some((m) => m.id === env)) return env
  return getDefaultTutorModel(null)
}

async function callAI(
  messages: { role: string; content: string }[],
  maxTokens: number,
  aiDeps: TutorAiDeps,
  model?: string
): Promise<string> {
  const m = model ?? getTutorModel(aiDeps.privateRuntime)
  const { content } = await chatCompletion(
    {
      messages: messages as { role: 'system' | 'user' | 'assistant'; content: string }[],
      model: m,
      max_tokens: maxTokens,
      temperature: 0.7,
      top_p: 0.9,
    },
    aiDeps.chatCtx
  )
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
  aiDeps: TutorAiDeps,
): Promise<{ question: string; options: Array<{ id: string; text: string; correct: boolean; explanation: string }>; topic: string; difficulty: 'recall' | 'application' | 'challenge' } | null> {
  if (resolveChatConfigError(aiDeps.orgSettings, aiDeps.privateRuntime)) return null

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
    const { content: raw } = await chatCompletion(
      {
        model: getDefaultMemoryModel(aiDeps.privateRuntime),
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 600,
        temperature: 0.5,
      },
      aiDeps.chatCtx
    )
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
    const session = await getRequestSession(request)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const { user } = session

    const admin = createServiceRoleSupabaseClient()

    let body: z.infer<typeof tutorQueryBodySchema>
    try {
      const payload = await request.json()
      const parsed = tutorQueryBodySchema.safeParse(payload)
      if (!parsed.success) {
        return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
      }
      body = parsed.data
    } catch {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
    }

    const {
      message: rawMessage,
      course_id,
      module_id,
      conversation_history = [],
      pasted_text,
      selected_text,
      active_modality,
      available_modalities,
      route: routeParam,
      pedagogy_mode: pedagogyParam,
    } = body

    if (course_id) {
      const { data: enrollmentForCourse } = await admin
        .from('enrollments')
        .select('id')
        .eq('user_id', user.id)
        .eq('course_id', course_id)
        .maybeSingle()
      if (!enrollmentForCourse) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }
    }

    const { orgSettings, privateRuntime } = await loadOrgAiChatContext(admin, {
      courseId: course_id ?? null,
      userId: user.id,
    })
    const cfgErr = resolveChatConfigError(orgSettings, privateRuntime)
    if (cfgErr) {
      return NextResponse.json({ error: cfgErr }, { status: 500 })
    }
    const aiDeps: TutorAiDeps = {
      orgSettings,
      privateRuntime,
      chatCtx: { privateOpenAi: privateRuntime },
    }
    const runtimePolicy = parseOrgAiRuntimePolicy(orgSettings)
    const routing = resolveRoutingMeta(orgSettings, privateRuntime)
    if (
      runtimePolicy.mode === 'local' &&
      runtimePolicy.strict_local &&
      routing.decision === 'cloud'
    ) {
      if (course_id) {
        try {
          await admin.from('learning_events').insert({
            user_id: user.id,
            course_id,
            module_id: module_id ?? null,
            event_type: 'ai_runtime_failure',
            modality: 'text',
            payload: {
              reason: 'STRICT_LOCAL_NO_FALLBACK',
              provider_id: routing.provider_id,
            },
          })
        } catch {
          // non-blocking telemetry
        }
      }
      return NextResponse.json(
        {
          response:
            'Your organisation requires Local AI, but no compatible local provider is currently available. Ask your admin to reconnect Local BYOM.',
          guardrail_refused: true,
          guardrail_code: 'strict_local_unavailable',
          routing: { ...routing, fallback_reason: 'STRICT_LOCAL_NO_FALLBACK' },
        },
        { status: 200 }
      )
    }

    const usage = await checkAndIncrementUsage(admin, user.id, 'tutor')
    if (!usage.allowed) {
      return NextResponse.json(
        { error: `Daily tutor request limit (${usage.limit}) reached. Try again tomorrow.` },
        { status: 429 }
      )
    }

    const { data: profForCompliance } = await admin
      .from('profiles')
      .select('org_id')
      .eq('id', user.id)
      .maybeSingle()
    let orgAiCompliance: OrgAiCompliance = {}
    if (profForCompliance?.org_id) {
      const { data: orgForCompliance } = await admin
        .from('organisations')
        .select('settings')
        .eq('id', profForCompliance.org_id)
        .maybeSingle()
      orgAiCompliance = parseOrgAiCompliance(orgForCompliance?.settings)
    }
    if (!rawMessage?.trim()) return NextResponse.json({ error: 'message required' }, { status: 400 })
    if (rawMessage.length > MAX_TUTOR_MESSAGE_LENGTH) {
      return NextResponse.json({ error: `Message too long. Max ${MAX_TUTOR_MESSAGE_LENGTH} characters.` }, { status: 400 })
    }
    // Strip lines that could override system/assistant role (prompt injection mitigation)
    const message = rawMessage
      .replace(/^\s*(system|assistant|user):\s*/gim, '[filtered]: ')
      .trim()
      .slice(0, MAX_TUTOR_MESSAGE_LENGTH)

    // ── Input guardrail: refuse off-topic / harmful requests ─────────────────
    const guardrail = await runTutorInputGuardrail(message, aiDeps)
    if (!guardrail.pass) {
      return NextResponse.json(
        { response: GUARDRAIL_REFUSAL_MESSAGE, guardrail_refused: true },
        { status: 200 }
      )
    }

    const skipSensitiveScan = orgAiCompliance.block_high_risk_pii_in_tutor === false
    if (!skipSensitiveScan) {
      const pasteEarly = (typeof pasted_text === 'string' ? pasted_text : '').slice(0, 15000)
      const selEarly = (typeof selected_text === 'string' ? selected_text : '').slice(0, 6000)
      for (const chunk of [message, pasteEarly, selEarly]) {
        const sens = scanSensitiveUserText(chunk)
        if (sens.blocked) {
          return NextResponse.json(
            {
              response: SENSITIVE_DATA_REFUSAL_MESSAGE,
              guardrail_refused: true,
              guardrail_code: 'sensitive_data_detected',
            },
            { status: 200 },
          )
        }
      }
    }

    const pastedText = (typeof pasted_text === 'string' ? pasted_text : '').trim().slice(0, 15000)
    const wantsWorkflow =
      pastedText.length > 0 &&
      /summarize|extract|key\s+terms|outline|bullet\s+points/i.test(message)
    if (wantsWorkflow && pastedText) {
      const workflowType = /extract|key\s+terms/i.test(message) ? 'extract_terms' : 'summarize'
      const baseUrl = request.nextUrl.origin
      try {
        const wfHeaders: Record<string, string> = { 'Content-Type': 'application/json' }
        const cookie = request.headers.get('cookie')
        if (cookie) wfHeaders.Cookie = cookie
        const authorization = request.headers.get('authorization')
        if (authorization) wfHeaders.Authorization = authorization

        const wfRes = await fetch(`${baseUrl}/api/tutor/workflow`, {
          method: 'POST',
          headers: wfHeaders,
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
        routing,
        })
      } catch {
        return NextResponse.json({
          response: "I couldn't run that analysis. Please try again.",
          blocks: [],
        })
      }
    }

  // ── 1. Load full course context (all modules) ──────────────────────────
  let courseContext = ''
  let courseTitle = ''
  let currentModuleTitle = ''

  if (course_id) {
    const { data: course } = await admin
      .from('courses')
      .select('title, modules(id, title, content, order_index)')
      .eq('id', course_id)
      .eq('status', 'published')
      .order('order_index', { referencedTable: 'modules', ascending: true })
      .maybeSingle()

    if (!course) {
      return NextResponse.json({ error: 'Course not available.' }, { status: 404 })
    }

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

  // ── 2. Load learner memory + cross-course history ─────────────────────
  const recentIxQuery = course_id
    ? admin
        .from('ai_interactions')
        .select('user_message, ai_response, created_at')
        .eq('user_id', user.id)
        .eq('course_id', course_id)
        .order('created_at', { ascending: false })
        .limit(6)
    : admin
        .from('ai_interactions')
        .select('user_message, ai_response, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(4)

  const [{ data: learnerProfile, error: learnerError }, { data: priorEnrollments }, { data: recentInteractions }, skillGapBlock] =
    await Promise.all([
      admin
        .from('learner_profiles')
        .select('ai_tutor_context, learning_pace, difficulty_comfort, cognitive_style, learner_preferences')
        .eq('user_id', user.id)
        .maybeSingle(),
      admin
        .from('enrollments')
        .select('course_id, status, progress_pct')
        .eq('user_id', user.id)
        .neq('course_id', course_id ?? '')
        .order('created_at', { ascending: false })
        .limit(5),
      recentIxQuery,
      loadSkillGapSummary(admin, user.id),
    ])

  // ── 2b. Action allowlists (always) + platform catalog text (floating chat only) ──
  let platformContextText = ''
  const [allCourses, pathList, enrollmentsRes, ragChunks] = await Promise.all([
    getCachedPublishedCourses(),
    getCachedPublishedPaths(),
    admin.from('enrollments').select('course_id, status, progress_pct').eq('user_id', user.id),
    course_id ? Promise.resolve([] as Awaited<ReturnType<typeof retrieveChunks>>) : retrieveChunks(message, { limit: 10 }),
  ])
  const catalogCourses = allCourses.slice(0, PLATFORM_CONTEXT_CATALOG_LIMIT)
  const { allowedCourseIds, allowedPathIds, enrollmentByCourseId } = buildTutorActionAllowlists({
    catalogCourseIds: catalogCourses.map((c) => c.id),
    pathIds: pathList.map((p) => p.id),
    enrollments: enrollmentsRes.data ?? [],
    activeCourseId: course_id ?? null,
  })

  if (!course_id) {
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
    const priorIds = priorEnrollments
      .map((e) => e.course_id)
      .filter((id): id is string => typeof id === 'string' && id.length > 0)
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
  const resolvedPrefs = resolveLearnerPreferences(learnerProfile?.learner_preferences ?? null)
  const contentLanguageBlock = buildTutorContentLanguageBlock(resolvedPrefs)
  const effectiveMode = effectivePedagogy(resolvedPrefs, pedagogyParam)

  let struggleSummaryText = ''
  if (resolvedPrefs.stuck_detection_tutor) {
    struggleSummaryText = await buildStruggleSignalsSummary(admin, user.id, { courseId: course_id ?? undefined })
  }

  const consolidatedDigest =
    resolvedPrefs.memory_digest_enabled && memory?.consolidated_interaction_digest
      ? String(memory.consolidated_interaction_digest).slice(0, 1800)
      : ''
  const modalityMatrixHint =
    resolvedPrefs.infer_modality_matrix && memory?.modality_context_matrix
      ? JSON.stringify(memory.modality_context_matrix).slice(0, 1000)
      : ''

  const storedResponseLength = (memory?.preferred_response_length as string) || 'concise'

  // If the learner explicitly asks for detail in this message, override the stored preference.
  // This allows "explain in detail" to work even when one-line answers is saved as the preference.
  const userWantsDetail = /\b(in detail|in more detail|elaborate|explain more|tell me more|give me more|expand|more about|comprehensive|step by step|step-by-step|walk me through|break it down|full explanation|thoroughly|eli5|explain like|summarize|summary|overview)\b/i.test(message)
  const preferredResponseLength = (userWantsDetail && storedResponseLength === 'one_line') ? 'detailed' : storedResponseLength

  const misconceptions = (memory?.misconceptions as Array<{ claim: string; recorded_at: string }> | undefined) ?? []
  const misconceptionsText =
    misconceptions.length > 0
      ? `\nObserved misconceptions (correct gently if the topic comes up):\n${misconceptions.map((m) => `- ${m.claim}`).join('\n')}`
      : ''

  const recentTutorTurnsText =
    recentInteractions && recentInteractions.length > 0
      ? `\nRecent tutor exchanges${course_id ? ' in this course' : ''} (continuity — do not repeat verbatim; use for context only):\n${recentInteractions
          .map((row) => {
            const q = String(row.user_message ?? '').trim().slice(0, 200)
            const a = String(row.ai_response ?? '').trim().slice(0, 200)
            return `- Learner: ${q || '…'} — Sudar: ${a || '…'}`
          })
          .join('\n')}`
      : ''

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
${priorCoursesText ? `\nPrior courses on this platform:\n${priorCoursesText}` : ''}${outcomesText}${skillGapBlock}${recentTutorTurnsText}${misconceptionsText}${
    consolidatedDigest
      ? `\n\nLonger-range conversation summary (secondary to course text — do not invent facts):\n${consolidatedDigest}`
      : ''
  }${
    modalityMatrixHint
      ? `\n\nModality×intent preferences (for suggesting formats only):\n${modalityMatrixHint}`
      : ''
  }${
    struggleSummaryText
      ? `\n\nFormative signals (learner may need extra care — be supportive, not judgmental):\n${struggleSummaryText}`
      : ''
  }`

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

${contentLanguageBlock}

You only assist with learning and platform use. If the user asks for something off-topic, illegal, or unethical, politely decline and redirect to learning.

Personality: warm, enthusiastic, encouraging. You love the subject matter and make it feel alive. You celebrate progress and meet people where they are.
${responseLengthRule}

Teaching mode for this learner (honour strictly):
${
  effectiveMode === 'guide'
    ? `- **Guide mode**: Prefer a short hint or clarifying question before revealing full answers. If they ask directly for the answer or seem frustrated, give a clear, complete answer.`
    : effectiveMode === 'exam_focus'
      ? `- **Exam / quick recall mode**: Be dense and minimal. Lead with the facts. Avoid long narrative and optional interactive BLOCKS unless the learner asks for depth.`
      : `- **Explain mode**: When they ask a concrete question, start with the direct answer, then explain with structure and examples.`
}

Formatting & Engagement (always apply):
- Use **bold** for key terms, *italic* for emphasis or analogies, and \`code\` for technical snippets.
- Use ### headings to break up longer answers into scannable sections.
- Use bullet lists (- item) or numbered lists for steps, comparisons, or multiple points.
- Use relatable real-world analogies and concrete examples — make abstract ideas tangible.
- ${effectiveMode === 'exam_focus' ? 'Skip lengthy follow-up nudges unless the learner asks for more.' : 'For longer explanations, end with a short follow-up nudge like "Want me to go deeper on any part?" or a quick question to check understanding.'}
- When the question is vague, offers multiple valid angles, or you want to match the learner's style, you may add tap-to-continue **choice_group** options via the BLOCKS line below. Keep labels short. Do not repeat your full answer inside BLOCKS.${effectiveMode === 'exam_focus' ? ' Omit choice_group in this mode unless clearly useful.' : ''}
- Optional **BLOCKS** (place after your answer; before ACTIONS when you use both). One line: BLOCKS: followed by a JSON array of objects with "id", "type", "payload". Valid types: **choice_group** (payload: question optional, choices: [{id, label, follow_up_message}]), **concept_card** (title, key_idea, analogy?, misconception?), **diagram** (title?, nodes: [{id, label}], edges?: [{from, to, label?}]), **timeline** (title?, items: [{id, title, description?}]), **media_card** (title, snippet?, image_url?, link_url?, only use URLs you are confident are safe https links), **interactive_demo** (component_id: molecule_viewer|cell_model|physics_demo|placeholder, label?, params object). Do not invent file URLs. Example:
BLOCKS: [{"id":"c1","type":"choice_group","payload":{"question":"How should we continue?","choices":[{"id":"a","label":"Use a simple analogy","follow_up_message":"Explain using a simple analogy."},{"id":"b","label":"Step-by-step","follow_up_message":"Walk me through step by step."}]}}]
- Never dump a wall of prose. Even short answers should be well-structured and easy to skim.

Reasoning: When answering, think step by step (what did they ask → what context is relevant → best answer/action). Use the course content and learner context below to personalize every response.
${SUDAR_PLATFORM_KNOWLEDGE}

Current route (where the learner is in the app): ${typeof routeParam === 'string' && routeParam ? routeParam : course_id ? '/courses/[id]/learn' : '/dashboard'}
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
- Never skip foundational content — personalize HOW you explain it, not WHETHER`

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
    aiResponse = await callAI(messages, maxTokens, aiDeps)
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'AI service error'
    logAiError('together', msg, { route: '/api/tutor/query' })
    return NextResponse.json(
      { error: msg.includes('401') || msg.includes('429') ? 'AI tutor is temporarily unavailable. Please try again later.' : 'Failed to get a response from Sudar. Please try again.' },
      { status: 502 }
    )
  }

  // ── Parse and validate ACTIONS + optional BLOCKS from response (output guardrails) ──
  const modelOut = parseTutorModelOutput(aiResponse)
  let responseText = modelOut.text
  const rawActions = modelOut.rawActions
  const modelBlocksFromParse = sanitizeTutorBlocks(modelOut.rawBlocks).filter((b) => b.type !== 'text')

  if (orgAiCompliance.tutor_redact_echoed_secrets !== false) {
    responseText = redactEchoedSensitiveDigits(responseText)
  }
  if (orgAiCompliance.tutor_output_moderation_strict === true) {
    responseText = applyStrictOutputRedaction(responseText)
  }
  const actions = validateActions(rawActions, allowedCourseIds, allowedPathIds, enrollmentByCourseId)
  if (!responseText) {
    responseText = 'I had trouble formatting that answer. Please ask again and I will retry.'
  }
  if (modelOut.malformedBlocks && /\nBLOCKS:\s*/i.test(aiResponse)) {
    responseText = `${responseText}\n\nI could not parse structured learning cards for that answer. Try asking again, or request a specific format.`
  }
  if (modelOut.malformedActions && actions.length === 0) {
    responseText = `${responseText}\n\nI could not generate quick action buttons for that response yet.`
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
    try {
      await admin.from('learning_events').insert({
        user_id: user.id,
        course_id,
        module_id: module_id ?? null,
        event_type: routing.fallback_used ? 'ai_runtime_fallback' : 'ai_runtime_route',
        modality: 'text',
        payload: {
          decision: routing.decision,
          provider_id: routing.provider_id,
          model: routing.model,
          fallback_reason: routing.fallback_reason ?? null,
        },
      })
    } catch (e) {
      console.error('[tutor] runtime event insert error:', e)
    }
  }

  // ── 6. Async memory update (fire and forget; cadence + org policy) ─────
  const memPolicy = clampTutorLlmMemoryExtractionPolicy(orgAiCompliance.tutor_llm_memory_extraction_policy)
  const orgMemHours = clampOrgTutorMemoryMinIntervalHours(orgAiCompliance.tutor_llm_memory_min_interval_hours)
  const lastMemLlmAt =
    typeof memory?.tutor_memory_llm_last_extraction_at === 'string'
      ? (memory.tutor_memory_llm_last_extraction_at as string)
      : undefined
  const runMemLlm = shouldRunTutorMemoryLlmExtraction({
    learnerCadence: resolvedPrefs.tutor_memory_llm_cadence,
    orgMinIntervalHours: orgMemHours,
    orgPolicy: memPolicy,
    lastExtractionAt: lastMemLlmAt,
  })
  if (runMemLlm) {
    updateLearnerMemory(user.id, message, responseText, admin, aiDeps).catch(() => {})
  }

  // ── 7. Optional web/image resource cards (org + env gated) ─────────────
  const resourceBlocks = await buildTutorResourceBlocks(orgAiCompliance, message, courseTitle, currentModuleTitle)

  // ── 8. Quiz block (if quiz intent detected) ───────────────────────────
  let quizBlock: { id: string; type: 'quiz'; payload: Record<string, unknown> } | null = null
  if (detectsQuizIntent(message)) {
    const conversationContext = Array.isArray(conversation_history)
      ? conversation_history.slice(-4).map((m: { content?: string }) => String(m.content ?? '')).join(' ')
      : ''
    const quizData = await generateQuizBlock(courseContext, currentModuleTitle, conversationContext, aiDeps)
    if (quizData) {
      quizBlock = { id: 'quiz-1', type: 'quiz', payload: quizData as unknown as Record<string, unknown> }
    }
  }

  const blocks: TutorBlock[] = [{ id: 'text-1', type: 'text', payload: { content: responseText } }]
  for (const b of modelBlocksFromParse) {
    blocks.push(b)
  }
  for (const b of resourceBlocks) {
    blocks.push(b)
  }
  if (actions.length > 0) {
    blocks.push({ id: 'actions-1', type: 'action_group', payload: { actions } as unknown as Record<string, unknown> })
  }
  if (quizBlock) blocks.push(quizBlock)

  return NextResponse.json({
    response: responseText,
    ...(actions.length > 0 ? { actions } : {}),
    blocks,
    routing,
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
  admin: any,
  aiDeps: TutorAiDeps
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
  "misconception_observed": "short wrong belief the learner stated, if any" or null,
  "style_note": "brief observation about how they learn" or null
}
Return only the JSON, nothing else.`

  try {
    const { content } = await chatCompletion(
      {
        model: getDefaultMemoryModel(aiDeps.privateRuntime),
        messages: [{ role: 'user', content: extractPrompt }],
        max_tokens: 150,
        temperature: 0.2,
      },
      aiDeps.chatCtx
    )
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

    const misconceptionRows = (existing.misconceptions as Array<{ claim: string; recorded_at: string }>) ?? []
    if (insights.misconception_observed) {
      misconceptionRows.push({
        claim: String(insights.misconception_observed),
        recorded_at: new Date().toISOString(),
      })
    }

    const updatedMemory = {
      ...existing,
      known_concepts: knownConcepts.slice(-20), // keep last 20
      struggles_with: struggles.slice(-10),
      misconceptions: misconceptionRows.slice(-10),
      learning_style_notes: insights.style_note || existing.learning_style_notes || '',
      interaction_count: interactionCount,
      last_updated: new Date().toISOString(),
      tutor_memory_llm_last_extraction_at: new Date().toISOString(),
    }

    await admin
      .from('learner_profiles')
      .update({ ai_tutor_context: updatedMemory })
      .eq('user_id', userId)

    const { data: orgRow } = await admin.from('profiles').select('org_id').eq('id', userId).maybeSingle()
    const orgId = orgRow?.org_id
    if (orgId) {
      if (insights.struggle_identified) {
        void recordStruggleTopics(admin, userId, orgId, [String(insights.struggle_identified)])
      }
      if (insights.new_concept_understood) {
        void recordMasteredTopics(admin, userId, orgId, [String(insights.new_concept_understood)])
      }
    }
  } catch {
    // Non-critical — memory update failure should not affect the chat
  }
}

import { createServiceRoleSupabaseClient } from '@/lib/supabase/server'
import { getRequestSession } from '@/lib/auth/requestSession'
import { getOrCreateOrg } from '@/lib/org'
import { NextRequest, NextResponse } from 'next/server'
import type { Database, Json } from '@/types/database'

type CourseInsert = Database['public']['Tables']['courses']['Insert']
import { chatCompletion, resolveChatConfigError, type ChatCompletionContext } from '@/lib/ai/chat'
import { fetchStudioOrgAiContext, studioMeteringChatCtx } from '@/lib/ai/studioOrgAiChat'
import { withUsageMetadata } from '@/lib/ai/studioUsageContext'
import { mergeBlueprintAnswersIntoSettings } from '@/lib/ai/courseGeneration/blueprintMerge'
import type { AiGenerationCourseSettings, BlueprintQuestionAnswer, CourseBlueprintQuestion } from '@/lib/ai/courseGeneration/types'
import { generateCourseMetadata } from '@/lib/ai/courseGeneration/courseMetadata'
import {
  getOrgDefaultUiLocale,
  suggestCourseCoverImagesFromIntelligence,
} from '@/lib/intelligence/courseCoverFromTogether'
import {
  fetchOrgTagCatalog,
  resolveOrCreateOrgTagsForLabels,
  setCourseOrgTagIds,
} from '@/lib/courseTags'
import { suggestExperiencePackFromText } from '@/lib/themes/experiencePacks'
import { fillEmptyModulesForCourse } from '@/lib/ai/courseGeneration'
import { safeFetchText } from '@/lib/security/safeFetch'

const MAX_DOC_CHARS = 45000

const emptyModuleContent = { type: 'text', body: '' } as const

async function callAI(
  messages: { role: string; content: string }[],
  maxTokens = 1200,
  ctx?: ChatCompletionContext
): Promise<string> {
  const { content } = await chatCompletion(
    {
      messages: messages as { role: 'system' | 'user' | 'assistant'; content: string }[],
      max_tokens: maxTokens,
      temperature: 0.7,
    },
    ctx
  )
  return content ?? ''
}

async function extractTextFromBuffer(buffer: Buffer, mimeType: string): Promise<string> {
  if (mimeType === 'application/pdf') {
    const mod = await import('pdf-parse') as { PDFParse?: new (opts: { data: Buffer }) => { getText(): Promise<{ text: string }> }; default?: (buf: Buffer) => Promise<{ text?: string }> }
    if (typeof mod.PDFParse !== 'function' && typeof mod.default !== 'function') {
      throw new Error('pdf-parse: expected PDFParse or default export')
    }
    if (mod.PDFParse) {
      const parser = new mod.PDFParse({ data: buffer })
      const result = await parser.getText()
      return (result?.text ?? '').trim()
    }
    const data = await (mod.default as (buf: Buffer) => Promise<{ text?: string }>)(buffer)
    return (data?.text ?? '').trim()
  }
  if (
    mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
    mimeType === 'application/msword'
  ) {
    const mammoth = await import('mammoth')
    const result = await mammoth.extractRawText({ buffer })
    return (result?.value ?? '').trim()
  }
  throw new Error('Unsupported file type. Use PDF or DOCX.')
}

async function extractTextFromUrl(url: string): Promise<string> {
  const html = await safeFetchText(url, {
    headers: { 'User-Agent': 'Sudar/1' },
    maxBytes: 1_000_000,
    timeoutMs: 10_000,
  })
  const stripped = html.replace(/<script[\s\S]*?<\/script>/gi, '').replace(/<style[\s\S]*?<\/style>/gi, '')
  return stripped.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, MAX_DOC_CHARS)
}

export async function POST(request: NextRequest) {
  const session = await getRequestSession(request)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { user } = session

  const admin = createServiceRoleSupabaseClient()
  const orgId = await getOrCreateOrg(user.id)
  const { orgSettings, privateRuntime } = await fetchStudioOrgAiContext(admin, orgId)
  const configError = resolveChatConfigError(orgSettings, privateRuntime)
  if (configError) return NextResponse.json({ error: configError }, { status: 500 })
  const chatAiCtx = studioMeteringChatCtx(
    admin,
    orgId,
    user.id,
    orgSettings,
    privateRuntime,
    'course_generation',
    '/api/ai/generate-from-document'
  )

  let documentText = ''
  const extraGen: Partial<AiGenerationCourseSettings> = {}
  const contentType = request.headers.get('content-type') ?? ''

  if (contentType.includes('multipart/form-data')) {
    const formData = await request.formData()
    const file = formData.get('file') as File | null
    if (!file) return NextResponse.json({ error: 'file required' }, { status: 400 })
    const buffer = Buffer.from(await file.arrayBuffer())
    const mime = file.type || 'application/octet-stream'
    documentText = await extractTextFromBuffer(buffer, mime)
    const ta = formData.get('target_audience')
    const tone = formData.get('tone')
    const industry = formData.get('industry')
    const nov = formData.get('no_external_video')
    const lo = formData.get('learning_outcomes')
    if (typeof ta === 'string' && ta.trim()) extraGen.target_audience = ta.trim()
    if (typeof tone === 'string' && tone.trim()) extraGen.tone = tone.trim()
    if (typeof industry === 'string' && industry.trim()) extraGen.industry = industry.trim()
    if (nov === 'true' || nov === 'on') extraGen.no_external_video = true
    if (typeof lo === 'string' && lo.trim()) {
      try {
        const parsed = JSON.parse(lo) as unknown
        if (Array.isArray(parsed)) {
          extraGen.learning_outcomes = parsed
            .filter((x): x is string => typeof x === 'string' && x.trim().length > 0)
            .map((s) => s.trim())
        }
      } catch {
        /* ignore */
      }
    }
    const ba = formData.get('blueprint_answers')
    const bq = formData.get('blueprint_questions')
    if (typeof ba === 'string' && typeof bq === 'string' && ba.trim() && bq.trim()) {
      try {
        const answers = JSON.parse(ba) as BlueprintQuestionAnswer[]
        const questions = JSON.parse(bq) as CourseBlueprintQuestion[]
        Object.assign(extraGen, mergeBlueprintAnswersIntoSettings(questions, answers))
      } catch {
        /* ignore */
      }
    }
  } else {
    const body = await request.json().catch(() => ({}))
    if (body.url) documentText = await extractTextFromUrl(body.url)
    else if (body.text && typeof body.text === 'string') documentText = body.text
    else return NextResponse.json({ error: 'Provide file (multipart), or JSON with url or text' }, { status: 400 })
    const b = body as Record<string, unknown>
    if (typeof b.target_audience === 'string' && b.target_audience.trim()) extraGen.target_audience = b.target_audience.trim()
    if (typeof b.tone === 'string' && b.tone.trim()) extraGen.tone = b.tone.trim()
    if (typeof b.industry === 'string' && b.industry.trim()) extraGen.industry = b.industry.trim()
    if (b.no_external_video === true) extraGen.no_external_video = true
    if (Array.isArray(b.learning_outcomes)) {
      extraGen.learning_outcomes = b.learning_outcomes
        .filter((x): x is string => typeof x === 'string' && x.trim().length > 0)
        .map((s) => s.trim())
    }
    if (Array.isArray(b.blueprint_answers) && Array.isArray(b.blueprint_questions)) {
      try {
        Object.assign(
          extraGen,
          mergeBlueprintAnswersIntoSettings(
            b.blueprint_questions as CourseBlueprintQuestion[],
            b.blueprint_answers as BlueprintQuestionAnswer[]
          )
        )
      } catch {
        /* ignore invalid blueprint */
      }
    }
  }

  documentText = documentText.slice(0, MAX_DOC_CHARS)
  if (!documentText.trim()) return NextResponse.json({ error: 'No text could be extracted from the document' }, { status: 400 })

  const numModules = 5
  const docSnippet = documentText.slice(0, 8000)

  const titlePrompt = `Based on the following document excerpt, suggest a short course title (max 10 words) that would teach this content.

Document excerpt:
${docSnippet}

Reply with ONLY the course title, no quotes or extra text.`

  let title = 'Course from document'
  try {
    const raw = await callAI([{ role: 'user', content: titlePrompt }], 80, chatAiCtx)
    if (raw.trim()) title = raw.trim()
  } catch {
    // keep default
  }

  let metaDescription: string
  let tagLabels: string[] = []
  try {
    const meta = await generateCourseMetadata(
      {
        title,
        document_excerpt: docSnippet,
        difficulty: 'intermediate',
        target_audience: extraGen.target_audience ?? undefined,
        learning_outcomes: extraGen.learning_outcomes,
        tone: extraGen.tone ?? undefined,
        industry: extraGen.industry ?? undefined,
      },
      chatAiCtx
    )
    metaDescription = meta.description
    tagLabels = meta.tag_labels
  } catch {
    metaDescription =
      documentText.trim().slice(0, 400) + (documentText.length > 400 ? '…' : '')
    tagLabels = []
  }

  const orgUi = await getOrgDefaultUiLocale(admin, orgId)
  const cover = await suggestCourseCoverImagesFromIntelligence(admin, orgId, title, tagLabels, orgUi)

  const outlinePrompt = `Using the document below, create a course outline of exactly ${numModules} module titles that teach this content in order.

Course working title: "${title}"
Learner-facing summary: ${metaDescription}

Document (excerpt):
${docSnippet}

Return ONLY a JSON array of ${numModules} module titles. Example: ["Introduction", "Core Concepts", "Applications", "Advanced", "Summary"]`

  let moduleTitles: string[] = []
  try {
    const raw = await callAI([{ role: 'user', content: outlinePrompt }], 300, chatAiCtx)
    const match = raw.match(/\[[\s\S]*\]/)
    if (match) moduleTitles = JSON.parse(match[0])
  } catch {
    moduleTitles = Array.from({ length: numModules }, (_, i) => `Module ${i + 1}`)
  }

  const aiGeneration: AiGenerationCourseSettings = {
    source: 'document',
    document_text: documentText,
    ...extraGen,
  }

  const suggestedPack = suggestExperiencePackFromText(title, tagLabels)
  const settingsRecord: Record<string, unknown> = { ai_generation: aiGeneration }
  if (suggestedPack !== 'none') {
    settingsRecord.experiencePack = suggestedPack
    settingsRecord.experiencePackSource = 'ai_suggested'
  }

  const now = new Date().toISOString()
  const insertCourse: CourseInsert = {
    org_id: orgId,
    created_by: user.id,
    title,
    description: metaDescription,
    difficulty: 'intermediate',
    status: 'draft',
    tags: [],
    settings: settingsRecord as unknown as Json,
    created_at: now,
    updated_at: now,
  }
  if (cover.thumbnail_url) insertCourse.thumbnail_url = cover.thumbnail_url
  if (cover.banner_url) insertCourse.banner_url = cover.banner_url

  const { data: course, error: courseError } = await admin.from('courses').insert(insertCourse)
    .select('id')
    .single()

  if (courseError || !course) return NextResponse.json({ error: courseError?.message }, { status: 500 })

  if (tagLabels.length > 0) {
    try {
      const catalog = await fetchOrgTagCatalog(admin, orgId)
      const orgTagIds = await resolveOrCreateOrgTagsForLabels(admin, orgId, tagLabels, catalog)
      await setCourseOrgTagIds(admin, course.id, orgTagIds)
    } catch {
      /* non-fatal */
    }
  }

  for (let i = 0; i < moduleTitles.length; i++) {
    const moduleTitle = moduleTitles[i]
    await admin.from('modules').insert({
      course_id: course.id,
      title: moduleTitle,
      content: emptyModuleContent as unknown as Json,
      order_index: i,
    })
  }

  const { data: moduleRows } = await admin
    .from('modules')
    .select('id, title, content, order_index')
    .eq('course_id', course.id)
    .order('order_index', { ascending: true })

  const fillResult = await fillEmptyModulesForCourse(admin, {
    course: {
      id: course.id,
      title,
      description: metaDescription,
      difficulty: 'intermediate',
      settings: settingsRecord as Record<string, unknown>,
    },
    modules: moduleRows ?? [],
    chatAiCtx: withUsageMetadata(chatAiCtx, { course_id: course.id }),
  })

  if (fillResult.error || !fillResult.completed) {
    return NextResponse.json(
      {
        error:
          fillResult.error ??
          'Course was created but module content generation did not finish. Try generating again or shorten the source document.',
        course_id: course.id,
        modules_generated: fillResult.modules_generated,
      },
      { status: 502 }
    )
  }

  return NextResponse.json({ course_id: course.id })
}

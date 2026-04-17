import { createClient, createAdminClient } from '@/lib/supabase/server'
import { getOrCreateOrg } from '@/lib/org'
import { NextRequest, NextResponse } from 'next/server'
import type { Database, Json } from '@/types/database'

type CourseInsert = Database['public']['Tables']['courses']['Insert']
import { chatCompletion, resolveChatConfigError, type ChatCompletionContext } from '@/lib/ai/chat'
import { fetchStudioOrgAiContext } from '@/lib/ai/studioOrgAiChat'
import { mergeBlueprintAnswersIntoSettings } from '@/lib/ai/courseGeneration/blueprintMerge'
import type { AiGenerationCourseSettings, CourseBlueprintQuestion } from '@/lib/ai/courseGeneration/types'
import { generateCourseMetadata, suggestCourseCoverImages } from '@/lib/ai/courseGeneration/courseMetadata'
import {
  fetchOrgTagCatalog,
  resolveOrCreateOrgTagsForLabels,
  setCourseOrgTagIds,
} from '@/lib/courseTags'
import { suggestExperiencePackFromText } from '@/lib/themes/experiencePacks'
import { fillEmptyModulesForCourse } from '@/lib/ai/courseGeneration'

/** Strip markdown code fences and extract/repair JSON for parsing. */
function extractJson(raw: string): string {
  let s = raw.trim()
  const fence = s.match(/^```(?:json)?\s*([\s\S]*?)```\s*$/m)
  if (fence) s = fence[1].trim()
  const openChar = s.startsWith('[') ? '[' : '{'
  const closeChar = openChar === '[' ? ']' : '}'
  if (!s.startsWith(openChar)) {
    const start = s.indexOf(openChar)
    if (start === -1) return s
    s = s.slice(start)
  }
  let depth = 0
  let inString: string | null = null
  let i = 0
  while (i < s.length) {
    const c = s[i]
    if (inString) {
      if (c === '\\') { i += 2; continue }
      if (c === inString) inString = null
      i++
      continue
    }
    if (c === '"' || c === "'") inString = c
    else if (c === openChar) depth++
    else if (c === closeChar) {
      depth--
      if (depth === 0) return repairJson(s.slice(0, i + 1))
    }
    i++
  }
  return repairJson(s)
}

function repairJson(s: string): string {
  return s.replace(/,(\s*[}\]])/g, '$1')
}

async function callAI(messages: { role: string; content: string }[], maxTokens = 1200, ctx?: ChatCompletionContext) {
  const { content } = await chatCompletion(
    {
      messages: messages as { role: 'system' | 'user' | 'assistant'; content: string }[],
      max_tokens: maxTokens,
      temperature: 0.7,
    },
    ctx
  )
  if (!content) throw new Error('AI returned empty response')
  return content
}

const emptyModuleContent = { type: 'text', body: '' } as const

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const admin = createAdminClient()
  const body = await request.json()
  const {
    title,
    description,
    brief,
    difficulty = 'intermediate',
    num_modules = 5,
    target_audience,
    learning_outcomes,
    tone,
    industry,
    no_external_video,
    blueprint_answers,
    blueprint_questions,
  } = body as {
    title?: string
    /** @deprecated use `brief` — kept for API compatibility; treated as author intent, not final copy */
    description?: string | null
    /** Author intent; AI generates the stored `description`. */
    brief?: string | null
    difficulty?: string
    num_modules?: number
    target_audience?: string
    learning_outcomes?: string[]
    tone?: string
    industry?: string
    no_external_video?: boolean
    blueprint_answers?: { question_id: string; option_id: string }[]
    blueprint_questions?: CourseBlueprintQuestion[]
  }

  if (!title) return NextResponse.json({ error: 'title required' }, { status: 400 })

  const orgId = await getOrCreateOrg(user.id)
  const { orgSettings, privateRuntime } = await fetchStudioOrgAiContext(admin, orgId)
  const configError = resolveChatConfigError(orgSettings, privateRuntime)
  if (configError) return NextResponse.json({ error: configError }, { status: 500 })
  const chatAiCtx = { privateOpenAi: privateRuntime }

  let aiGeneration: AiGenerationCourseSettings = {
    source: 'prompt',
    ...(target_audience?.trim() ? { target_audience: target_audience.trim() } : {}),
    ...(Array.isArray(learning_outcomes) && learning_outcomes.length > 0
      ? { learning_outcomes: learning_outcomes.filter((o) => typeof o === 'string' && o.trim()).map((o) => o.trim()) }
      : {}),
    ...(tone?.trim() ? { tone: tone.trim() } : {}),
    ...(industry?.trim() ? { industry: industry.trim() } : {}),
    ...(no_external_video === true ? { no_external_video: true } : {}),
  }

  if (
    Array.isArray(blueprint_answers) &&
    blueprint_answers.length > 0 &&
    Array.isArray(blueprint_questions) &&
    blueprint_questions.length > 0
  ) {
    const answers = blueprint_answers.filter(
      (a) => a && typeof a.question_id === 'string' && typeof a.option_id === 'string'
    )
    const merged = mergeBlueprintAnswersIntoSettings(blueprint_questions, answers)
    aiGeneration = { ...aiGeneration, ...merged }
  }

  const authorBrief = (brief ?? description ?? '').trim() || null

  let aiDescription: string
  let tagLabels: string[]
  try {
    const meta = await generateCourseMetadata(
      {
        title,
        brief: authorBrief,
        difficulty,
        target_audience: target_audience?.trim(),
        learning_outcomes:
          Array.isArray(learning_outcomes) && learning_outcomes.length > 0
            ? learning_outcomes.filter((o) => typeof o === 'string' && o.trim()).map((o) => o.trim())
            : undefined,
        tone: tone?.trim(),
        industry: industry?.trim(),
      },
      chatAiCtx
    )
    aiDescription = meta.description
    tagLabels = meta.tag_labels
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    return NextResponse.json(
      { error: `AI course metadata failed: ${message}. See AI & API Keys in Settings.` },
      { status: 502 }
    )
  }

  const cover = await suggestCourseCoverImages(title, tagLabels)

  const suggestedPack = suggestExperiencePackFromText(title, tagLabels)
  const settingsPayload: Record<string, unknown> = { ai_generation: aiGeneration }
  if (suggestedPack !== 'none') {
    settingsPayload.experiencePack = suggestedPack
    settingsPayload.experiencePackSource = 'ai_suggested'
  }

  const now = new Date().toISOString()
  const insertCourse: CourseInsert = {
    org_id: orgId,
    created_by: user.id,
    title,
    description: aiDescription,
    difficulty,
    status: 'draft',
    tags: [],
    settings: settingsPayload as unknown as Json,
    created_at: now,
    updated_at: now,
  }
  if (cover.thumbnail_url) insertCourse.thumbnail_url = cover.thumbnail_url
  if (cover.banner_url) insertCourse.banner_url = cover.banner_url

  const { data: course, error: courseError } = await admin.from('courses').insert(insertCourse)
    .select('id')
    .single()

  if (courseError || !course) return NextResponse.json({ error: courseError?.message }, { status: 500 })

  try {
    const catalog = await fetchOrgTagCatalog(admin, orgId)
    const orgTagIds = await resolveOrCreateOrgTagsForLabels(admin, orgId, tagLabels, catalog)
    await setCourseOrgTagIds(admin, course.id, orgTagIds)
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: `Tag assignment failed: ${message}` }, { status: 500 })
  }

  const outlinePrompt = `Create a course outline for:

Course: "${title}"
Learner-facing summary: ${aiDescription}
${authorBrief ? `Author intent (extra context): ${authorBrief}` : ''}
Difficulty: ${difficulty}
Modules: ${num_modules}

Return ONLY a JSON array of ${num_modules} module titles. No other text.
Example: ["Introduction", "Core Concepts", "Practical Applications", "Advanced Topics", "Summary"]`

  let moduleTitles: string[] = []
  try {
    const raw = await callAI([{ role: 'user', content: outlinePrompt }], 300, chatAiCtx)
    const jsonStr = extractJson(raw)
    if (!jsonStr.startsWith('[')) throw new Error('Outline response did not contain a JSON array')
    moduleTitles = JSON.parse(jsonStr)
    if (!Array.isArray(moduleTitles) || moduleTitles.length === 0) throw new Error('Outline must be a non-empty array of module titles')
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    return NextResponse.json(
      { error: `AI outline generation failed: ${message}. See AI & API Keys in Settings.` },
      { status: 502 }
    )
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
      description: aiDescription,
      difficulty,
      settings: settingsPayload as Record<string, unknown>,
    },
    modules: moduleRows ?? [],
    chatAiCtx,
  })

  if (fillResult.error || !fillResult.completed) {
    return NextResponse.json(
      {
        error:
          fillResult.error ??
          'Course was created but module content generation did not finish. You can try again from the course page or contact support.',
        course_id: course.id,
        modules_generated: fillResult.modules_generated,
      },
      { status: 502 }
    )
  }

  const moduleResults = moduleTitles.map((t, idx) => ({ title: t, order_index: idx }))
  return NextResponse.json({ course_id: course.id, modules: moduleResults })
}

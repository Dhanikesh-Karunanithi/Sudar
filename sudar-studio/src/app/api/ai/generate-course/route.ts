import { createServiceRoleSupabaseClient } from '@/lib/supabase/server'
import { getRequestSession } from '@/lib/auth/requestSession'
import { getOrCreateOrg } from '@/lib/org'
import { NextRequest, NextResponse } from 'next/server'
import type { Database, Json } from '@/types/database'

type CourseInsert = Database['public']['Tables']['courses']['Insert']
import { chatCompletion, resolveChatConfigError, type ChatCompletionContext } from '@/lib/ai/chat'
import { fetchStudioOrgAiContext } from '@/lib/ai/studioOrgAiChat'
import { mergeBlueprintAnswersIntoSettings } from '@/lib/ai/courseGeneration/blueprintMerge'
import type { AiGenerationCourseSettings, CourseBlueprintQuestion } from '@/lib/ai/courseGeneration/types'
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
import { fillEmptyModulesForCourse, isWorkerInvocationLimitError, MODULES_PER_WORKER_INVOCATION } from '@/lib/ai/courseGeneration'
import { placeholderModuleTitles } from '@/lib/ai/courseGeneration/placeholderModules'
import { runInWaitUntil } from '@/lib/ai/courseGeneration/scheduleBackgroundFill'
import { buildStudioUsageChatCtx, withUsageMetadata } from '@/lib/ai/studioUsageContext'
import {
  assembleHtmlExportPayload,
  assembleScormJsonPayload,
} from '@/lib/export/assembleCourseExport'
import type { ModuleRow } from '@/lib/export/buildScorm12ExportZip'
import { studioCourseEditorUrl, mintCoursePackageToken, studioCoursePackageUrl } from '@/lib/urls/studioOrigin'

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
  try {
    return await postGenerateCourseInner(request)
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ success: false, error: `generate-course crashed: ${message}` }, { status: 500 })
  }
}

async function postGenerateCourseInner(request: NextRequest) {
  const session = await getRequestSession(request)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { user } = session

  const admin = createServiceRoleSupabaseClient()
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
    course_type,
    theme_preference,
    brand_colors,
    tone_preference,
    content_density,
    vary_introductions,
    minimize_sidecards,
    strict_component_validation,
    apply_quality_filtering,
    export_format,
    background_fill,
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
    course_type?: string
    theme_preference?: string
    brand_colors?: { primary: string; accent: string; secondary?: string }
    tone_preference?: string
    content_density?: 'concise' | 'balanced' | 'detailed'
    vary_introductions?: boolean
    minimize_sidecards?: boolean
    strict_component_validation?: boolean
    apply_quality_filtering?: boolean
    export_format?: 'html' | 'scorm12' | 'both' | 'none'
    background_fill?: boolean
  }

  if (!title) return NextResponse.json({ error: 'title required' }, { status: 400 })

  const orgId = await getOrCreateOrg(user.id)
  const { orgSettings, privateRuntime } = await fetchStudioOrgAiContext(admin, orgId)
  const configError = resolveChatConfigError(orgSettings, privateRuntime)
  if (configError) return NextResponse.json({ error: configError }, { status: 500 })
  const chatAiCtx = buildStudioUsageChatCtx({
    admin,
    orgId,
    userId: user.id,
    feature: 'course_generation',
    route: '/api/ai/generate-course',
    privateRuntime,
    orgSettings,
  })

  let aiGeneration: AiGenerationCourseSettings = {
    source: 'prompt',
    ...(target_audience?.trim() ? { target_audience: target_audience.trim() } : {}),
    ...(Array.isArray(learning_outcomes) && learning_outcomes.length > 0
      ? { learning_outcomes: learning_outcomes.filter((o) => typeof o === 'string' && o.trim()).map((o) => o.trim()) }
      : {}),
    ...(tone?.trim() ? { tone: tone.trim() } : {}),
    ...(industry?.trim() ? { industry: industry.trim() } : {}),
    ...(no_external_video === true ? { no_external_video: true } : {}),
    ...(course_type?.trim() ? { course_type: course_type.trim() } : {}),
    ...(theme_preference?.trim() ? { theme_preference: theme_preference.trim() } : {}),
    ...(brand_colors?.primary && brand_colors?.accent ? { brand_colors } : {}),
    ...(tone_preference?.trim() ? { tone_preference: tone_preference.trim() } : {}),
    ...(content_density ? { content_density } : {}),
    ...(vary_introductions === false ? { vary_introductions: false } : { vary_introductions: true }),
    ...(minimize_sidecards === false ? { minimize_sidecards: false } : { minimize_sidecards: true }),
    ...(strict_component_validation === false
      ? { strict_component_validation: false }
      : { strict_component_validation: true }),
    ...(apply_quality_filtering === false
      ? { apply_quality_filtering: false }
      : { apply_quality_filtering: true }),
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
  const backgroundFill = background_fill === true

  let aiDescription: string
  let tagLabels: string[]
  if (backgroundFill) {
    aiDescription = authorBrief || `A microlearning course on ${title}.`
    tagLabels = []
  } else {
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
  }

  const leanGeneration = content_density === 'concise' || Boolean(export_format) || backgroundFill
  const cover = leanGeneration
    ? { thumbnail_url: null as string | null, banner_url: null as string | null }
    : await suggestCourseCoverImagesFromIntelligence(
        admin,
        orgId,
        title,
        tagLabels,
        await getOrgDefaultUiLocale(admin, orgId)
      )

  const suggestedPack = suggestExperiencePackFromText(title, tagLabels)
  const packageToken = backgroundFill ? mintCoursePackageToken() : null
  const settingsPayload: Record<string, unknown> = { ai_generation: aiGeneration }
  if (packageToken) settingsPayload.mcp_package_token = packageToken
  if (theme_preference?.trim()) {
    settingsPayload.content_theme = theme_preference.trim()
  }
  if (brand_colors?.primary) {
    settingsPayload.brand_colors = brand_colors
  }
  if (suggestedPack !== 'none' && !theme_preference?.trim()) {
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

  if (!backgroundFill) {
    try {
      const catalog = await fetchOrgTagCatalog(admin, orgId)
      const orgTagIds = await resolveOrCreateOrgTagsForLabels(admin, orgId, tagLabels, catalog)
      await setCourseOrgTagIds(admin, course.id, orgTagIds)
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      return NextResponse.json({ error: `Tag assignment failed: ${message}` }, { status: 500 })
    }
  }

  let moduleTitles: string[] = []
  if (backgroundFill) {
    moduleTitles = placeholderModuleTitles(title, Math.min(3, Number(num_modules) || 3))
  } else {
    const outlinePrompt = `Create a course outline for:

Course: "${title}"
Learner-facing summary: ${aiDescription}
${authorBrief ? `Author intent (extra context): ${authorBrief}` : ''}
Difficulty: ${difficulty}
Modules: ${num_modules}

Return ONLY a JSON array of ${num_modules} module titles. No other text.
Example: ["Introduction", "Core Concepts", "Practical Applications", "Advanced Topics", "Summary"]`

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

  if (backgroundFill) {
    const studioUrl = studioCourseEditorUrl(course.id, request.url)
    const packageUrl = packageToken ? studioCoursePackageUrl(packageToken, request.url) : null
    const moduleResults = moduleTitles.map((t, idx) => ({ title: t, order_index: idx }))
    const queued = await runInWaitUntil(
      fillEmptyModulesForCourse(admin, {
        course: {
          id: course.id,
          title,
          description: aiDescription,
          difficulty,
          settings: settingsPayload as Record<string, unknown>,
        },
        modules: moduleRows ?? [],
        chatAiCtx: withUsageMetadata(chatAiCtx, { course_id: course.id }),
        maxModules: MODULES_PER_WORKER_INVOCATION,
      }),
    )
    return NextResponse.json({
      success: true,
      needs_continue: true,
      generation_status: 'running',
      course_id: course.id,
      studio_url: studioUrl,
      package_url: packageUrl,
      html_url: packageUrl,
      scorm_url: null,
      modules: moduleResults,
      modules_generated: 0,
      remaining_empty: moduleResults.length,
      poll_after_seconds: 20,
      kick_queued: queued,
    })
  }

  const fillResult = await fillEmptyModulesForCourse(admin, {
    course: {
      id: course.id,
      title,
      description: aiDescription,
      difficulty,
      settings: settingsPayload as Record<string, unknown>,
    },
    modules: moduleRows ?? [],
    chatAiCtx: withUsageMetadata(chatAiCtx, { course_id: course.id }),
    maxModules: MODULES_PER_WORKER_INVOCATION,
  })

  const studioUrl = studioCourseEditorUrl(course.id, request.url)
  const moduleResults = moduleTitles.map((t, idx) => ({ title: t, order_index: idx }))
  const remainingEmpty = fillResult.remaining_empty ?? 0
  const retryableLimit =
    Boolean(fillResult.error) && isWorkerInvocationLimitError(fillResult.error ?? '')

  if (!fillResult.completed) {
    return NextResponse.json(
      {
        success: true,
        needs_continue: true,
        course_id: course.id,
        studio_url: studioUrl,
        modules: moduleResults,
        modules_generated: fillResult.modules_generated,
        remaining_empty: remainingEmpty,
        ...(fillResult.error ? { warning: fillResult.error } : {}),
        ...(retryableLimit
          ? {}
          : fillResult.error
            ? { error: fillResult.error }
            : {}),
      },
      { status: retryableLimit || !fillResult.error ? 200 : 502 }
    )
  }

  const { data: filledModules } = await admin
    .from('modules')
    .select('title, order_index, content')
    .eq('course_id', course.id)
    .order('order_index', { ascending: true })

  const moduleRowsForExport = (filledModules ?? []) as ModuleRow[]
  const wantHtml = export_format === 'html' || export_format === 'both'
  const wantScorm = export_format === 'scorm12' || export_format === 'both'

  const payload: {
    success: true
    completed: true
    course_id: string
    studio_url: string
    modules: { title: string; order_index: number }[]
    html?: ReturnType<typeof assembleHtmlExportPayload>
    scorm?: Awaited<ReturnType<typeof assembleScormJsonPayload>>
  } = {
    success: true,
    completed: true,
    course_id: course.id,
    studio_url: studioUrl,
    modules: moduleResults,
  }

  if (wantHtml) {
    payload.html = assembleHtmlExportPayload({
      courseId: course.id,
      courseTitle: title,
      studioUrl,
      modules: moduleRowsForExport,
    })
  }
  if (wantScorm) {
    payload.scorm = await assembleScormJsonPayload({
      admin,
      courseId: course.id,
      courseTitle: title,
      studioUrl,
      modules: moduleRowsForExport,
    })
  }

  return NextResponse.json(payload)
}

import { chatCompletion, resolveChatConfigError } from '@/lib/ai/chat'
import type { CreateAuthContext } from '@/lib/alp/createAuth'
import { createMeteringCtx } from '@/lib/alp/createAuth'
import {
  buildDocumentOutlinePrompt,
  buildFlashcardsPrompt,
  buildInteractivePrompt,
  buildOutlinePrompt,
  buildQuizPrompt,
  parseFlashcardsFromAi,
  parseInteractiveFromAi,
  parseOutlineFromAi,
  parseQuizFromAi,
  buildCreateXapiStatement,
  type ExportFormat,
  type InteractiveElement,
  type QuizResult,
} from '@shared-content-generation'
import {
  buildFlashcardsScormZip,
  buildInteractiveScormZip,
  buildQuizScormZip,
} from '@shared-content-generation/scorm/buildSingleScoZip'

export async function generateQuizForCreate(
  ctx: CreateAuthContext,
  params: {
    content: string
    courseTitle?: string
    moduleTitle?: string
    difficulty?: string
    numQuestions?: number
    language?: string
    exportFormat?: ExportFormat
    emitXapi?: boolean
  },
): Promise<{
  quiz: QuizResult
  scorm_base64?: string
  xapi_statements?: Record<string, unknown>[]
}> {
  const configError = resolveChatConfigError(ctx.orgSettings, ctx.privateRuntime)
  if (configError) throw new Error(configError)

  const prompt = buildQuizPrompt({
    content: params.content,
    courseTitle: params.courseTitle,
    moduleTitle: params.moduleTitle,
    difficulty: params.difficulty ?? 'intermediate',
    numQuestions: params.numQuestions ?? 4,
    language: params.language ?? 'en',
  })

  const { content: raw } = await chatCompletion(
    { messages: [{ role: 'user', content: prompt }], max_tokens: 1200, temperature: 0.5 },
    createMeteringCtx(ctx, 'studio_assist', '/api/alp/create/quiz'),
  )
  if (!raw) throw new Error('AI generation failed')

  const quiz = parseQuizFromAi(raw)
  const title = params.moduleTitle ?? params.courseTitle ?? 'Sudar Quiz'
  const result: {
    quiz: QuizResult
    scorm_base64?: string
    xapi_statements?: Record<string, unknown>[]
  } = { quiz }

  if (params.exportFormat === 'scorm12') {
    const zip = buildQuizScormZip({
      title,
      questions: quiz.questions.map((q) => ({
        question: q.question,
        options: q.options,
        correct: q.correct,
        explanation: q.explanation,
      })),
    })
    result.scorm_base64 = zip.toString('base64')
  }

  if (params.emitXapi) {
    result.xapi_statements = [
      buildCreateXapiStatement({
        creatorUserId: ctx.creatorUserId,
        tool: 'quiz',
        exportFormat: params.exportFormat ?? 'json',
      }),
    ]
  }

  return result
}

export async function generateFlashcardsForCreate(
  ctx: CreateAuthContext,
  params: {
    content: string
    moduleTitle?: string
    language?: string
    exportFormat?: ExportFormat
  },
): Promise<{
  cards: { front: string; back: string }[]
  scorm_base64?: string
}> {
  const configError = resolveChatConfigError(ctx.orgSettings, ctx.privateRuntime)
  if (configError) throw new Error(configError)

  const prompt = buildFlashcardsPrompt({
    content: params.content,
    moduleTitle: params.moduleTitle,
    language: params.language ?? 'en',
  })

  const { content: raw } = await chatCompletion(
    { messages: [{ role: 'user', content: prompt }], max_tokens: 1200, temperature: 0.3 },
    createMeteringCtx(ctx, 'modality_flashcards', '/api/alp/create/flashcards'),
  )
  if (!raw) throw new Error('AI generation failed')

  const cards = parseFlashcardsFromAi(raw)
  if (!cards.length) throw new Error('No flashcards generated')

  const result: { cards: typeof cards; scorm_base64?: string } = { cards }
  if (params.exportFormat === 'scorm12') {
    result.scorm_base64 = buildFlashcardsScormZip({
      title: params.moduleTitle ?? 'Flashcards',
      cards,
    }).toString('base64')
  }
  return result
}

export async function generateInteractiveForCreate(
  ctx: CreateAuthContext,
  params: {
    content: string
    title?: string
    componentTypes?: string[]
    imageUrl?: string
    language?: string
    exportFormat?: ExportFormat
  },
): Promise<{ interactive_elements: InteractiveElement[]; scorm_base64?: string }> {
  const configError = resolveChatConfigError(ctx.orgSettings, ctx.privateRuntime)
  if (configError) throw new Error(configError)

  const prompt = buildInteractivePrompt({
    content: params.content,
    title: params.title,
    componentTypes: params.componentTypes ?? ['timeline', 'matching'],
    imageUrl: params.imageUrl,
    language: params.language ?? 'en',
  })

  const { content: raw } = await chatCompletion(
    { messages: [{ role: 'user', content: prompt }], max_tokens: 1800, temperature: 0.5 },
    createMeteringCtx(ctx, 'course_generation', '/api/alp/create/interactive'),
  )
  if (!raw) throw new Error('AI generation failed')

  const interactive_elements = parseInteractiveFromAi(raw)
  const result: { interactive_elements: InteractiveElement[]; scorm_base64?: string } = {
    interactive_elements,
  }

  if (params.exportFormat === 'scorm12') {
    result.scorm_base64 = buildInteractiveScormZip({
      title: params.title ?? 'Interactive Activity',
      elements: interactive_elements.map((el) => ({
        type: el.type,
        data: el.data as Record<string, unknown> | undefined,
      })),
    }).toString('base64')
  }

  return result
}

export async function generateOutlineForCreate(
  ctx: CreateAuthContext,
  params: {
    courseTitle: string
    description?: string
    difficulty?: string
    numModules?: number
    language?: string
  },
): Promise<{ modules: string[] }> {
  const configError = resolveChatConfigError(ctx.orgSettings, ctx.privateRuntime)
  if (configError) throw new Error(configError)

  const prompt = buildOutlinePrompt({
    courseTitle: params.courseTitle,
    description: params.description,
    difficulty: params.difficulty ?? 'intermediate',
    numModules: params.numModules ?? 5,
    language: params.language ?? 'en',
  })

  const { content: raw } = await chatCompletion(
    { messages: [{ role: 'user', content: prompt }], max_tokens: 400, temperature: 0.6 },
    createMeteringCtx(ctx, 'course_generation', '/api/alp/create/outline'),
  )
  if (!raw) throw new Error('AI generation failed')

  return { modules: parseOutlineFromAi(raw) }
}

export async function generateDocumentOutlineForCreate(
  ctx: CreateAuthContext,
  params: {
    text: string
    courseTitle?: string
    difficulty?: string
    language?: string
  },
): Promise<{ modules: string[]; course_title?: string }> {
  const configError = resolveChatConfigError(ctx.orgSettings, ctx.privateRuntime)
  if (configError) throw new Error(configError)

  const prompt = buildDocumentOutlinePrompt({
    text: params.text,
    courseTitle: params.courseTitle,
    difficulty: params.difficulty ?? 'intermediate',
    language: params.language ?? 'en',
  })

  const { content: raw } = await chatCompletion(
    { messages: [{ role: 'user', content: prompt }], max_tokens: 600, temperature: 0.5 },
    createMeteringCtx(ctx, 'course_generation', '/api/alp/create/from-document'),
  )
  if (!raw) throw new Error('AI generation failed')

  return {
    modules: parseOutlineFromAi(raw),
    course_title: params.courseTitle,
  }
}

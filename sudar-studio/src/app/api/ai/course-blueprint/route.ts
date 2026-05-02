import { NextRequest, NextResponse } from 'next/server'
import { createServiceRoleSupabaseClient, createClient } from '@/lib/supabase/server'
import { chatCompletion, resolveChatConfigError, type ChatCompletionContext } from '@/lib/ai/chat'
import { fetchStudioOrgAiContext } from '@/lib/ai/studioOrgAiChat'
import { getOrCreateOrg } from '@/lib/org'
import { DEFAULT_COURSE_BLUEPRINT_QUESTIONS } from '@/lib/ai/courseGeneration/blueprintCatalog'
import type { CourseBlueprintQuestion } from '@/lib/ai/courseGeneration/types'

function extractJson(raw: string): string {
  let s = raw.trim()
  const fence = s.match(/^```(?:json)?\s*([\s\S]*?)```\s*$/m)
  if (fence) s = fence[1].trim()
  const openChar = s.startsWith('{') ? '{' : '['
  const closeChar = openChar === '{' ? '}' : ']'
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
      if (c === '\\') {
        i += 2
        continue
      }
      if (c === inString) inString = null
      i++
      continue
    }
    if (c === '"' || c === "'") inString = c
    else if (c === openChar) depth++
    else if (c === closeChar) {
      depth--
      if (depth === 0) return s.slice(0, i + 1).replace(/,(\s*[}\]])/g, '$1')
    }
    i++
  }
  return s.replace(/,(\s*[}\]])/g, '$1')
}

/**
 * Optionally rephrase blueprint prompts for the specific course (effects unchanged).
 */
async function personalizeBlueprintQuestions(
  courseTitle: string,
  brief: string | null,
  chatAiCtx: ChatCompletionContext | undefined
): Promise<CourseBlueprintQuestion[] | null> {
  if (!chatAiCtx) return null
  const baseJson = JSON.stringify({ questions: DEFAULT_COURSE_BLUEPRINT_QUESTIONS })
  const system = `You personalize instructional-design questionnaire text for a specific course. Input is JSON with "questions" (each has id, prompt, options with id, label, effect). Return ONLY valid JSON with the SAME structure, ids, and effect objects — only improve "prompt" and option "label" strings to mention the course context when natural. Do not add or remove questions or options.`

  const user = `Course title: "${courseTitle}"
${brief ? `Brief: ${brief}` : ''}

Base JSON:
${baseJson}`

  try {
    const { content } = await chatCompletion(
      {
        messages: [
          { role: 'system', content: system },
          { role: 'user', content: user },
        ],
        max_tokens: 3500,
        temperature: 0.4,
      },
      chatAiCtx
    )
    if (!content) return null
    const parsed = JSON.parse(extractJson(content)) as { questions?: CourseBlueprintQuestion[] }
    if (!Array.isArray(parsed.questions) || parsed.questions.length !== DEFAULT_COURSE_BLUEPRINT_QUESTIONS.length) {
      return null
    }
    return parsed.questions
  } catch {
    return null
  }
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const admin = createServiceRoleSupabaseClient()
  const orgId = await getOrCreateOrg(user.id)
  const { orgSettings, privateRuntime } = await fetchStudioOrgAiContext(admin, orgId)
  const configError = resolveChatConfigError(orgSettings, privateRuntime)
  const chatAiCtx: ChatCompletionContext | undefined = configError ? undefined : { privateOpenAi: privateRuntime }

  const body = await request.json().catch(() => ({}))
  const title = typeof body.title === 'string' ? body.title.trim() : ''
  const brief = typeof body.brief === 'string' ? body.brief.trim() : null

  let questions = DEFAULT_COURSE_BLUEPRINT_QUESTIONS
  if (title && chatAiCtx) {
    const personalized = await personalizeBlueprintQuestions(title, brief, chatAiCtx)
    if (personalized) questions = personalized
  }

  return NextResponse.json({ success: true, questions })
}

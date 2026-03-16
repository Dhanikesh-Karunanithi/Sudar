import { createClient, createAdminClient } from '@/lib/supabase/server'
import { getOrCreateOrg } from '@/lib/org'
import { NextRequest, NextResponse } from 'next/server'
import type { RichContent } from '@/types/content'
import type { Json } from '@/types/database'
import { getImagesForSections } from '@/lib/media/imageSearch'
import { selectComponentsForModule, toInteractiveElements, type ModuleRole } from '@/lib/ai/componentSelector'
import { chatCompletion, getChatConfigError } from '@/lib/ai/chat'

/** Strip markdown code fences and extract/repair JSON for parsing. */
function extractJson(raw: string): string {
  let s = raw.trim()
  // Remove ```json ... ``` or ``` ... ```
  const fence = s.match(/^```(?:json)?\s*([\s\S]*?)```\s*$/m)
  if (fence) s = fence[1].trim()
  // Find first complete object or array by brace matching (respect strings)
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

/** Remove trailing commas before ] or } so JSON.parse accepts LLM output. */
function repairJson(s: string): string {
  return s.replace(/,(\s*[}\]])/g, '$1')
}

async function callAI(messages: { role: string; content: string }[], maxTokens = 1200) {
  const { content } = await chatCompletion({
    messages: messages as { role: 'system' | 'user' | 'assistant'; content: string }[],
    max_tokens: maxTokens,
    temperature: 0.7,
  })
  if (!content) throw new Error('AI returned empty response')
  return content
}

const RICH_CONTENT_JSON_SCHEMA = `
Return ONLY a valid JSON object (no markdown code blocks, no \`\`\`, no explanation before or after). This exact shape:
{
  "introduction": "1-2 sentence intro for this module",
  "sections": [
    { "heading": "Section title", "content": "Paragraph or short text", "type": "text" },
    { "heading": "Another section", "content": "Content here. Use type 'code' for code snippets.", "type": "text" }
  ],
  "summary": "1-2 sentence summary",
  "interactiveElements": [
    { "type": "expandable", "data": { "title": "Expandable title", "content": "Hidden content shown when expanded" } }
    OR
    { "type": "quiz", "data": { "question": "Multiple choice question?", "options": ["A", "B", "C"], "correctAnswer": "A", "explanation": "Why A is correct" } }
  ],
  "sideCard": { "title": "Tip or key point", "content": "Short content", "tips": ["Optional tip 1"] }
}
Rules: sections must have at least 2 items. Include exactly one interactiveElement (expandable or quiz). sideCard is optional. No trailing commas. Output raw JSON only.`

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const configError = getChatConfigError()
  if (configError) return NextResponse.json({ error: configError }, { status: 500 })

  const admin = createAdminClient()
  const { title, description, difficulty = 'intermediate', num_modules = 5 } = await request.json()
  if (!title) return NextResponse.json({ error: 'title required' }, { status: 400 })

  const orgId = await getOrCreateOrg(user.id)

  const now = new Date().toISOString()
  const { data: course, error: courseError } = await admin
    .from('courses')
    .insert({ org_id: orgId, created_by: user.id, title, description: description ?? null, difficulty, status: 'draft', created_at: now, updated_at: now })
    .select('id')
    .single()

  if (courseError || !course) return NextResponse.json({ error: courseError?.message }, { status: 500 })

  const outlinePrompt = `Create a course outline for:

Course: "${title}"
${description ? `Description: ${description}` : ''}
Difficulty: ${difficulty}
Modules: ${num_modules}

Return ONLY a JSON array of ${num_modules} module titles. No other text.
Example: ["Introduction", "Core Concepts", "Practical Applications", "Advanced Topics", "Summary"]`

  let moduleTitles: string[] = []
  try {
    const raw = await callAI([{ role: 'user', content: outlinePrompt }], 300)
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

  const systemPrompt = `You are an expert instructional designer. Create structured module content for an e-learning course. Output valid JSON only. Difficulty: ${difficulty}. ${RICH_CONTENT_JSON_SCHEMA}`

  for (let i = 0; i < moduleTitles.length; i++) {
    const moduleTitle = moduleTitles[i]
    let rich: RichContent
    try {
      const raw = await callAI([
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `Course: "${title}". ${description ? `Description: ${description}. ` : ''}Generate the JSON object for module "${moduleTitle}". Include introduction, at least 2 sections, summary, one interactiveElement (expandable or quiz), and optional sideCard.` },
      ], 4000)
      const jsonStr = extractJson(raw)
      if (!jsonStr.startsWith('{')) throw new Error('No JSON object in AI response')
      const parsed = JSON.parse(jsonStr) as Record<string, unknown>
      if (!Array.isArray(parsed.sections) || parsed.sections.length < 1) {
        parsed.sections = [{ heading: 'Overview', content: String(parsed.introduction || parsed.summary || '').slice(0, 500) || moduleTitle, type: 'text' }]
      }
      rich = {
        type: 'rich',
        introduction: typeof parsed.introduction === 'string' ? parsed.introduction : undefined,
        sections: parsed.sections as RichContent['sections'],
        summary: typeof parsed.summary === 'string' ? parsed.summary : undefined,
        interactiveElements: Array.isArray(parsed.interactiveElements) ? parsed.interactiveElements as RichContent['interactiveElements'] : undefined,
        sideCard: parsed.sideCard && typeof parsed.sideCard === 'object' ? parsed.sideCard as RichContent['sideCard'] : undefined,
      }

      const imageResults = await getImagesForSections(moduleTitle, title, rich.sections.length)
      if (imageResults.length > 0 && rich.sections.length > 0) {
        rich.sections = rich.sections.map((section, idx) => {
          const img = imageResults[idx]
          return img ? { ...section, image: { url: img.url, alt: img.alt, attribution: img.attribution } } : section
        })
      }

      const contentSummary =
        rich.introduction?.slice(0, 300) ||
        rich.sections[0]?.content?.slice(0, 300) ||
        moduleTitle
      const role: ModuleRole =
        i === 0 ? 'intro' : i === moduleTitles.length - 1 ? 'capstone' : 'core'
      const selected = await selectComponentsForModule(moduleTitle, contentSummary, role)
      if (selected.length > 0) {
        const extra = toInteractiveElements(selected)
        rich.interactiveElements = [...(rich.interactiveElements ?? []), ...extra]
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      return NextResponse.json(
        { error: `AI content failed for module "${moduleTitle}": ${message}. See AI & API Keys in Settings.` },
        { status: 502 }
      )
    }

    await admin
      .from('modules')
      .insert({ course_id: course.id, title: moduleTitle, content: rich as unknown as Json, order_index: i })
  }

  const moduleResults = moduleTitles.map((t, idx) => ({ title: t, order_index: idx }))
  return NextResponse.json({ course_id: course.id, modules: moduleResults })
}

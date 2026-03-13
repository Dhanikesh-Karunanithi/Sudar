import { createClient, createAdminClient } from '@/lib/supabase/server'
import { getOrCreateOrg } from '@/lib/org'
import { NextRequest, NextResponse } from 'next/server'
import type { RichContent } from '@/types/content'
import { chatCompletion, getChatConfigError } from '@/lib/ai/chat'

const MAX_DOC_CHARS = 45000

async function callAI(messages: { role: string; content: string }[], maxTokens = 1200) {
  const { content } = await chatCompletion({
    messages: messages as { role: 'system' | 'user' | 'assistant'; content: string }[],
    max_tokens: maxTokens,
    temperature: 0.7,
  })
  return content ?? ''
}

const RICH_CONTENT_JSON_SCHEMA = `
Return ONLY a valid JSON object (no markdown, no explanation) with this exact shape:
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
Rules: sections must have at least 2 items. Include exactly one interactiveElement (expandable or quiz). sideCard is optional.`

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
  const res = await fetch(url, { headers: { 'User-Agent': 'Sudar/1' } })
  if (!res.ok) throw new Error(`Failed to fetch URL: ${res.status}`)
  const html = await res.text()
  const stripped = html.replace(/<script[\s\S]*?<\/script>/gi, '').replace(/<style[\s\S]*?<\/style>/gi, '')
  return stripped.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, MAX_DOC_CHARS)
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const configError = getChatConfigError()
  if (configError) return NextResponse.json({ error: configError }, { status: 500 })

  const admin = createAdminClient()
  const orgId = await getOrCreateOrg(user.id)

  let documentText = ''
  const contentType = request.headers.get('content-type') ?? ''

  if (contentType.includes('multipart/form-data')) {
    const formData = await request.formData()
    const file = formData.get('file') as File | null
    if (!file) return NextResponse.json({ error: 'file required' }, { status: 400 })
    const buffer = Buffer.from(await file.arrayBuffer())
    const mime = file.type || 'application/octet-stream'
    documentText = await extractTextFromBuffer(buffer, mime)
  } else {
    const body = await request.json().catch(() => ({}))
    if (body.url) documentText = await extractTextFromUrl(body.url)
    else if (body.text && typeof body.text === 'string') documentText = body.text
    else return NextResponse.json({ error: 'Provide file (multipart), or JSON with url or text' }, { status: 400 })
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
    const raw = await callAI([{ role: 'user', content: titlePrompt }], 80)
    if (raw.trim()) title = raw.trim()
  } catch {
    // keep default
  }

  const outlinePrompt = `Using the document below, create a course outline of exactly ${numModules} module titles that teach this content in order.

Document (excerpt):
${docSnippet}

Return ONLY a JSON array of ${numModules} module titles. Example: ["Introduction", "Core Concepts", "Applications", "Advanced", "Summary"]`

  let moduleTitles: string[] = []
  try {
    const raw = await callAI([{ role: 'user', content: outlinePrompt }], 300)
    const match = raw.match(/\[[\s\S]*\]/)
    if (match) moduleTitles = JSON.parse(match[0])
  } catch {
    moduleTitles = Array.from({ length: numModules }, (_, i) => `Module ${i + 1}`)
  }

  const now = new Date().toISOString()
  const { data: course, error: courseError } = await admin
    .from('courses')
    .insert({ org_id: orgId, created_by: user.id, title, description: 'Generated from your document.', difficulty: 'intermediate', status: 'draft', created_at: now, updated_at: now })
    .select('id')
    .single()

  if (courseError || !course) return NextResponse.json({ error: courseError?.message }, { status: 500 })

  const systemPrompt = `You are an expert instructional designer. Create structured module content based ONLY on the provided document. Use the document as your source. Output valid JSON only. ${RICH_CONTENT_JSON_SCHEMA}`

  const chunkSize = 12000
  for (let i = 0; i < moduleTitles.length; i++) {
    const moduleTitle = moduleTitles[i]
    const start = Math.min(i * (documentText.length / moduleTitles.length), documentText.length - chunkSize)
    const docChunk = documentText.slice(Math.max(0, start), start + chunkSize)

    let rich: RichContent
    try {
      const raw = await callAI([
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `Document excerpt:\n${docChunk}\n\nGenerate the JSON object for module "${moduleTitle}". Use only information from the document.` },
      ], 4000)
      const jsonMatch = raw.match(/\{[\s\S]*\}/)
      if (!jsonMatch) throw new Error('No JSON in response')
      const parsed = JSON.parse(jsonMatch[0]) as Record<string, unknown>
      if (!Array.isArray(parsed.sections) || parsed.sections.length < 1) {
        parsed.sections = [{ heading: 'Overview', content: String(parsed.introduction || parsed.summary || '').slice(0, 500) || `Content for ${moduleTitle}.`, type: 'text' }]
      }
      rich = {
        type: 'rich',
        introduction: typeof parsed.introduction === 'string' ? parsed.introduction : undefined,
        sections: parsed.sections as RichContent['sections'],
        summary: typeof parsed.summary === 'string' ? parsed.summary : undefined,
        interactiveElements: Array.isArray(parsed.interactiveElements) ? parsed.interactiveElements as RichContent['interactiveElements'] : undefined,
        sideCard: parsed.sideCard && typeof parsed.sideCard === 'object' ? parsed.sideCard as RichContent['sideCard'] : undefined,
      }
    } catch {
      rich = {
        type: 'rich',
        introduction: `This module covers ${moduleTitle}.`,
        sections: [{ heading: 'Content', content: `Content for ${moduleTitle} (from document).`, type: 'text' }],
        summary: `Summary of ${moduleTitle}.`,
      }
    }

    await admin
      .from('modules')
      .insert({ course_id: course.id, title: moduleTitle, content: rich as unknown as Record<string, unknown>, order_index: i })
  }

  return NextResponse.json({ course_id: course.id })
}

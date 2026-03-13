/**
 * Generate mindmap (SudarMind) from module or full course content for the Map modality.
 * Returns a tree structure { root: { label, children: MindMapNode[] } }.
 * Scope: 'module' = current section; 'course' = full course overview.
 */
import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { chatCompletion, getChatConfigError } from '@/lib/ai/chat'

const MODULE_CONTENT_CAP = 6000
const COURSE_TOTAL_CAP = 15000
const MAX_TOKENS_MODULE = 1200
const MAX_TOKENS_COURSE = 2500

export interface MindMapNode {
  label: string
  /** Optional one-sentence insight to show on hover (helps the learner understand the concept). */
  insight?: string
  children?: MindMapNode[]
}

/** Recursively normalize and cap depth/breadth of parsed nodes (depth 4–5, sane label lengths). Preserves optional insight. */
function normalizeNode(
  raw: unknown,
  depth: number,
  maxDepth: number,
  labelMaxLen: number
): MindMapNode | null {
  if (depth > maxDepth) return null
  if (!raw || typeof raw !== 'object' || !('label' in raw)) return null
  const label = String((raw as { label?: unknown }).label ?? '').trim().slice(0, labelMaxLen)
  if (!label) return null
  const insightRaw = (raw as { insight?: unknown }).insight
  const insight = typeof insightRaw === 'string' ? insightRaw.trim().slice(0, 160) : undefined
  const childrenRaw = (raw as { children?: unknown }).children
  const children: MindMapNode[] = []
  if (Array.isArray(childrenRaw) && depth < maxDepth) {
    const maxChildren = depth === 0 ? 8 : depth === 1 ? 6 : 5
    const childLabelLen = depth === 0 ? 80 : depth === 1 ? 70 : 60
    for (let i = 0; i < childrenRaw.length && children.length < maxChildren; i++) {
      const child = normalizeNode(childrenRaw[i], depth + 1, maxDepth, childLabelLen)
      if (child) children.push(child)
    }
  }
  return { label, ...(insight ? { insight } : {}), children: children.length > 0 ? children : undefined }
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const configError = getChatConfigError()
  if (configError) return NextResponse.json({ error: configError }, { status: 500 })

  const body = await request.json().catch(() => ({}))
  const scope = body.scope === 'course' ? 'course' : 'module'

  let prompt: string
  let maxTokens: number
  let fallbackRootLabel: string

  if (scope === 'course') {
    const courseTitle = typeof body.course_title === 'string' ? body.course_title.trim() : 'Course'
    const modulesRaw = Array.isArray(body.modules) ? body.modules : []
    const modules = modulesRaw
      .filter((m): m is { title: string; content: string } => m && typeof m === 'object' && typeof (m as { title?: unknown }).title === 'string' && typeof (m as { content?: unknown }).content === 'string')
      .map((m) => ({ title: String(m.title).trim(), content: String(m.content).trim() }))
    if (!courseTitle || modules.length === 0) {
      return NextResponse.json({ error: 'course_title and modules array required for scope=course' }, { status: 400 })
    }
    let combined = ''
    for (const m of modules) {
      const block = `## Module: ${m.title}\n\n${m.content}`
      if (combined.length + block.length > COURSE_TOTAL_CAP) {
        combined += block.slice(0, Math.max(0, COURSE_TOTAL_CAP - combined.length))
        break
      }
      combined += block + '\n\n'
    }
    combined = combined.trim()
    if (!combined) return NextResponse.json({ error: 'No module content for course mindmap' }, { status: 400 })

    prompt = `You are a learning designer. From the following FULL COURSE content (multiple modules), create a single mindmap as a JSON object. The goal is to give the learner a complete overview and show how concepts connect across the course.

Rules:
- Root = the course title (one root object with "label" and "children").
- First level = each module as a branch (use the module title as the node label).
- Under each module, add the KEY CONCEPTS and topics from that module — not just section headings. Extract learning concepts, terms, and how they relate. Use a branch-style structure: each node is a concept or topic; children are sub-concepts or related ideas.
- You may show connections (e.g. a concept under one module that relates to another). Depth up to 5. Use 3–6 modules as top-level children; under each, 2–6 concept nodes, and sub-nodes as needed to capture the ideas.
- Output ONLY valid JSON: a single object with "label" (string) and "children" (array of objects, each with "label", optional "insight" (one short sentence that helps the learner understand or remember this concept), and optional "children"). No markdown, no explanation.

Course title: ${courseTitle}

Content:
${combined}

JSON object (root with label and children):`
    maxTokens = MAX_TOKENS_COURSE
    fallbackRootLabel = courseTitle
  } else {
    const content = typeof body.content === 'string' ? body.content.trim() : ''
    const moduleTitle = typeof body.module_title === 'string' ? body.module_title : 'Module'
    if (!content) return NextResponse.json({ error: 'content required' }, { status: 400 })

    const text = content.slice(0, MODULE_CONTENT_CAP)
    prompt = `You are a learning designer. From the following module content, create a mindmap as a JSON object. The goal is to help the learner see how concepts connect — do NOT just list section headings.

Rules:
- Extract KEY LEARNING CONCEPTS, terms, and how they relate. Build a branch-style structure: root = module topic; children = main concepts; under each concept add sub-concepts and related ideas.
- Use concepts and terms from the content, not just headings. Depth up to 4–5. Use 3–6 main branches, each with 2–5 sub-nodes as needed to capture the ideas.
- Output ONLY valid JSON: a single root object with "label" (short title) and "children" (array of nodes). Each node has "label" (short phrase), optional "insight" (one short sentence that helps the learner understand or remember this concept), and optionally "children" (nested array). No markdown, no explanation.

Module title: ${moduleTitle}

Content:
${text}

JSON object (root with label and children):`
    maxTokens = MAX_TOKENS_MODULE
    fallbackRootLabel = moduleTitle
  }

  const { content: raw } = await chatCompletion({
    messages: [{ role: 'user', content: prompt }],
    max_tokens: maxTokens,
    temperature: 0.3,
  })
  const rawStr = raw ?? ''

  let jsonStr = rawStr
  const match = rawStr.match(/\{[\s\S]*\}/)
  if (match) jsonStr = match[0]

  let root: MindMapNode
  try {
    const parsed = JSON.parse(jsonStr) as { label?: string; children?: unknown[] }
    const normalized = normalizeNode(parsed, 0, 5, 100)
    root = normalized ?? { label: fallbackRootLabel, children: [] }
  } catch {
    root = { label: fallbackRootLabel, children: [] }
  }

  return NextResponse.json({ root })
}

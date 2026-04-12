import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database, Json } from '@/types/database'
import type { ModuleContent } from '@/types/content'
import { getOneImage } from '@/lib/media/imageSearch'
import { searchYouTubeWatchUrl } from '@/lib/media/videoSearch'
import {
  selectComponentsForModule,
  toInteractiveElements,
  sanitizeVideoComponents,
  type ModuleRole,
  type ComponentType,
} from '@/lib/ai/componentSelector'
import { LESSON_ARCHETYPES, type LessonArchetype, selectArchetype } from '@/lib/ai/archetypeSelector'
import { chatCompletion, type ChatCompletionContext } from '@/lib/ai/chat'
import { getModuleBodyText } from '@/lib/contentBlocks'
import { curriculumPlanSchema } from './schemas'
import type {
  AiGenerationCourseSettings,
  CourseRowForGeneration,
  CurriculumEntry,
  FillEmptyModulesResult,
  ModuleRowForGeneration,
} from './types'
import { buildCurriculumPlanPrompt, buildEnvelopePrompt, buildModuleContentPrompt } from './prompts'
import { extractSummary, parseEnvelope, parseMarkdownSections } from './parse'
import { getAiGenerationSettings } from './settings'

async function callAI(
  messages: { role: string; content: string }[],
  maxTokens = 1500,
  ctx?: ChatCompletionContext
): Promise<string> {
  const { content } = await chatCompletion(
    {
      messages: messages as { role: 'system' | 'user' | 'assistant'; content: string }[],
      max_tokens: maxTokens,
      temperature: 0.7,
      top_p: 0.9,
    },
    ctx
  )
  if (!content) throw new Error('AI returned empty response')
  return content
}

function documentChunkForModule(full: string, moduleIndex: number, totalModules: number, chunkSize: number): string {
  if (!full.trim()) return ''
  const n = Math.max(1, totalModules)
  const start = Math.min(moduleIndex * (full.length / n), Math.max(0, full.length - chunkSize))
  return full.slice(Math.max(0, start), start + chunkSize)
}

/** Last 1–2 component types used in this generation run (cross-module variety). */
function recentExcludes(recentTypes: ComponentType[]): ComponentType[] {
  return [...new Set(recentTypes)].slice(-2)
}

export async function fillEmptyModulesForCourse(
  admin: SupabaseClient<Database>,
  input: {
    course: CourseRowForGeneration
    modules: ModuleRowForGeneration[]
    chatAiCtx?: ChatCompletionContext
  }
): Promise<FillEmptyModulesResult> {
  const { course, modules: allModules, chatAiCtx } = input
  const gen = getAiGenerationSettings(course.settings) as AiGenerationCourseSettings | undefined

  if (allModules.length === 0) {
    return { completed: true, modules_generated: 0 }
  }

  const emptyModules = allModules.filter((m) => !getModuleBodyText(m.content as ModuleContent)?.trim())
  if (emptyModules.length === 0) {
    return { completed: true, modules_generated: 0 }
  }

  const allTitles = allModules.map((m) => m.title)
  const difficulty = course.difficulty ?? 'intermediate'
  const documentFull = gen?.document_text?.trim() ?? ''

  let curriculum: CurriculumEntry[]
  try {
    const planMessages = buildCurriculumPlanPrompt(
      course.title,
      course.description,
      difficulty,
      allTitles,
      gen
    )
    const raw = await callAI(planMessages, 2000, chatAiCtx)
    const match = raw.match(/\[[\s\S]*\]/)
    if (!match) throw new Error('Curriculum plan response did not contain a JSON array')
    const parsed = JSON.parse(match[0]) as unknown
    curriculum = curriculumPlanSchema.parse(parsed) as CurriculumEntry[]
    let prevArchetype: LessonArchetype | null = null
    for (let i = 0; i < curriculum.length; i++) {
      const e = curriculum[i]
      const ar = e.archetype?.trim().toLowerCase()
      const valid: LessonArchetype = LESSON_ARCHETYPES.includes(ar as LessonArchetype)
        ? (ar as LessonArchetype)
        : selectArchetype(e.bloomLevel, e.pedagogicalRole ?? '', i, prevArchetype)
      e.archetype = valid
      prevArchetype = valid
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return { completed: false, modules_generated: 0, error: `Curriculum plan generation failed: ${msg}` }
  }

  const curriculumByTitle = new Map<string, CurriculumEntry>()
  for (const entry of curriculum) {
    curriculumByTitle.set(entry.title.toLowerCase().trim(), entry)
  }

  const priorSummaries: { title: string; summary: string }[] = []
  for (const mod of allModules) {
    const body = getModuleBodyText(mod.content as ModuleContent)?.trim()
    if (body) {
      priorSummaries.push({ title: mod.title, summary: extractSummary(body, mod.title) })
    }
  }

  let generated = 0
  const recentComponentTypes: ComponentType[] = []

  for (const mod of emptyModules) {
    let entry = curriculumByTitle.get(mod.title.toLowerCase().trim())
    if (!entry) {
      const idx = allModules.findIndex((m) => m.id === mod.id)
      const fallback: CurriculumEntry = {
        title: mod.title,
        bloomLevel: idx <= 1 ? 'Understand' : idx <= 3 ? 'Apply' : 'Analyze',
        pedagogicalRole: idx === 0 ? 'Foundation / orientation' : 'Concept exploration',
        sectionStructure: ['Why this matters', 'Core ideas', 'Practical application', 'Key takeaways'],
        brief: `Covers ${mod.title} within the course curriculum.`,
        buildOn:
          priorSummaries.length > 0
            ? `Builds on ${priorSummaries[priorSummaries.length - 1].title}`
            : 'None — this is the foundation',
      }
      curriculumByTitle.set(mod.title.toLowerCase().trim(), fallback)
      entry = fallback
    }

    const resolvedEntry = entry
    const modIndex = allModules.findIndex((m) => m.id === mod.id)

    const docChunk =
      documentFull && gen?.source === 'document'
        ? documentChunkForModule(documentFull, modIndex, allModules.length, 12000)
        : undefined

    const contentMessages = buildModuleContentPrompt(
      course.title,
      course.description,
      difficulty,
      resolvedEntry,
      modIndex,
      allModules.length,
      curriculum,
      priorSummaries,
      { documentGrounding: docChunk, gen }
    )

    try {
      const content = await callAI(contentMessages, 1800, chatAiCtx)

      const imageResult = await getOneImage(mod.title, course.title)

      const contentSummary = content.slice(0, 500)
      const role: ModuleRole =
        modIndex === 0
          ? 'intro'
          : modIndex >= allModules.length - 1
            ? 'capstone'
            : resolvedEntry.pedagogicalRole?.toLowerCase().includes('assessment')
              ? 'assessment'
              : resolvedEntry.pedagogicalRole?.toLowerCase().includes('deep')
                ? 'deep-dive'
                : 'core'

      const noExternal = gen?.no_external_video === true
      let verifiedVideo: { url: string; title: string } | null = null
      if (!noExternal) {
        verifiedVideo = await searchYouTubeWatchUrl(`${mod.title} ${course.title}`)
      }
      const allowVideo = !noExternal && verifiedVideo != null

      let selected = await selectComponentsForModule(mod.title, contentSummary, role, {
        excludeTypes: recentExcludes(recentComponentTypes),
        allowVideoInPrompt: allowVideo,
        verifiedVideoUrl: verifiedVideo?.url ?? null,
        chatContext: chatAiCtx,
      })

      selected = sanitizeVideoComponents(selected, {
        allowExternalVideo: !noExternal,
        verifiedWatchUrl: verifiedVideo?.url ?? null,
      })

      for (const c of selected) {
        recentComponentTypes.push(c.type)
      }

      const interactiveElements =
        selected.length > 0 ? toInteractiveElements(selected, resolvedEntry.bloomLevel) : []

      const parsedSections = parseMarkdownSections(content)
      const sections = parsedSections.map((sec, i) => ({
        heading: sec.heading,
        content: sec.content,
        type: 'text' as const,
        ...(i === 0 && imageResult ? { image: imageResult } : {}),
      }))

      let entryState: { type: string; content: string } | undefined
      let exitState: { type: string; content: string } | undefined
      let sideCard: { title: string; content: string; tips?: string[]; noteType?: string } | undefined
      try {
        const envelopeMessages = buildEnvelopePrompt(
          mod.title,
          content,
          (resolvedEntry.archetype ?? 'cold-open') as string
        )
        const envelopeRaw = await callAI(envelopeMessages, 800, chatAiCtx)
        const envelope = parseEnvelope(envelopeRaw)
        if (envelope) {
          entryState = envelope.entryState
          exitState = envelope.exitState
          sideCard = envelope.sideCard
        }
      } catch {
        // envelope optional
      }

      const richContent = {
        type: 'rich',
        archetype: (resolvedEntry.archetype ?? 'cold-open') as LessonArchetype,
        ...(entryState ? { entryState } : {}),
        ...(exitState ? { exitState } : {}),
        sections,
        ...(interactiveElements.length > 0 ? { interactiveElements } : {}),
        ...(sideCard ? { sideCard } : {}),
      }

      const { error: upErr } = await admin
        .from('modules')
        .update({ content: richContent as unknown as Json })
        .eq('id', mod.id)

      if (upErr) {
        return {
          completed: false,
          modules_generated: generated,
          error: `Failed to save module "${mod.title}": ${upErr.message}`,
        }
      }

      priorSummaries.push({ title: mod.title, summary: extractSummary(content, mod.title) })
      generated++
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      return {
        completed: false,
        modules_generated: generated,
        error: `Content generation failed for "${mod.title}": ${msg}`,
      }
    }
  }

  return { completed: true, modules_generated: generated }
}

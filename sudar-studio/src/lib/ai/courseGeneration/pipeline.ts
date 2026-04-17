import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database, Json } from '@/types/database'
import type { ModuleContent } from '@/types/content'
import { getOneImage } from '@/lib/media/imageSearch'
import { searchYouTubeWatchUrl } from '@/lib/media/videoSearch'
import {
  COMPONENT_PROFILES,
  selectComponentsForModule,
  toInteractiveElements,
  sanitizeVideoComponents,
  type ModuleRole,
  type ComponentType,
} from '@/lib/ai/componentSelector'
import type { LessonArchetype } from '@/lib/ai/archetypeSelector'
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
import {
  buildCritiqueRefinePrompt,
  buildCurriculumPlanPrompt,
  buildEnvelopePrompt,
  buildModuleContentPrompt,
} from './prompts'
import { normalizeCurriculumToModules } from './curriculumResolve'
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

/** Spread hero images across sections instead of always attaching to section 0. */
function pickImageSectionIndices(sectionCount: number, modIndex: number): number[] {
  if (sectionCount <= 0) return []
  if (sectionCount === 1) return [0]
  const primary = modIndex % sectionCount
  if (sectionCount >= 6) {
    const secondary = (modIndex + Math.max(2, Math.floor(sectionCount / 3))) % sectionCount
    if (secondary !== primary) return [primary, secondary].sort((a, b) => a - b)
  }
  return [primary]
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

  const modulesOrdered = [...allModules].sort((a, b) => a.order_index - b.order_index)
  const emptyModules = modulesOrdered.filter((m) => !getModuleBodyText(m.content as ModuleContent)?.trim())
  if (emptyModules.length === 0) {
    return { completed: true, modules_generated: 0 }
  }

  const allTitles = modulesOrdered.map((m) => m.title)
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
    const rawPlan = curriculumPlanSchema.parse(parsed) as CurriculumEntry[]
    curriculum = normalizeCurriculumToModules(rawPlan, allTitles)
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return { completed: false, modules_generated: 0, error: `Curriculum plan generation failed: ${msg}` }
  }

  const priorSummaries: { title: string; summary: string }[] = []
  for (const mod of modulesOrdered) {
    const body = getModuleBodyText(mod.content as ModuleContent)?.trim()
    if (body) {
      priorSummaries.push({ title: mod.title, summary: extractSummary(body, mod.title) })
    }
  }

  let generated = 0
  const recentComponentTypes: ComponentType[] = []
  const courseComponentCounts: Partial<Record<ComponentType, number>> = {}
  const telemetryArchetypes: string[] = []
  const telemetryComponents: string[] = []
  let critiquePasses = 0

  const validTypes = new Set(COMPONENT_PROFILES.map((p) => p.type))
  const forbiddenDisallowed: ComponentType[] | undefined = (() => {
    if (!Array.isArray(gen?.forbidden_component_types) || gen!.forbidden_component_types!.length === 0) return undefined
    const f = gen!.forbidden_component_types!.filter(
      (t): t is ComponentType => typeof t === 'string' && validTypes.has(t as ComponentType)
    )
    return f.length > 0 ? f : undefined
  })()

  for (const mod of emptyModules) {
    const modIndex = modulesOrdered.findIndex((m) => m.id === mod.id)
    const resolvedEntry = curriculum[modIndex]
    if (!resolvedEntry) {
      return {
        completed: false,
        modules_generated: generated,
        error: `Internal error: no curriculum entry for module index ${modIndex}`,
      }
    }

    const docChunk =
      documentFull && gen?.source === 'document'
        ? documentChunkForModule(documentFull, modIndex, modulesOrdered.length, 12000)
        : undefined

    const contentMessages = buildModuleContentPrompt(
      course.title,
      course.description,
      difficulty,
      resolvedEntry,
      modIndex,
      modulesOrdered.length,
      curriculum,
      priorSummaries,
      { documentGrounding: docChunk, gen }
    )

    try {
      let content = await callAI(contentMessages, 1800, chatAiCtx)

      const isCapstone = modIndex >= modulesOrdered.length - 1
      if (isCapstone) {
        try {
          const critiqueMessages = buildCritiqueRefinePrompt(
            course.title,
            mod.title,
            gen?.learning_outcomes,
            content
          )
          const refined = await callAI(critiqueMessages, 2200, chatAiCtx)
          if (refined.trim()) {
            content = refined
            critiquePasses++
          }
        } catch {
          // keep draft
        }
      }

      const contentSummary = content.slice(0, 500)
      const role: ModuleRole =
        modIndex === 0
          ? 'intro'
          : modIndex >= modulesOrdered.length - 1
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
        disallowedTypes: forbiddenDisallowed,
        allowVideoInPrompt: allowVideo,
        verifiedVideoUrl: verifiedVideo?.url ?? null,
        chatContext: chatAiCtx,
        bloomLevel: resolvedEntry.bloomLevel,
        archetype: resolvedEntry.archetype,
        learningOutcomes: gen?.learning_outcomes,
        assessmentDensity: gen?.assessment_density,
        interactivityLevel: gen?.interactivity_level,
        primaryPedagogy: gen?.primary_pedagogy,
        moduleFullText: content,
        courseTypeCounts: { ...courseComponentCounts },
        moduleIndex: modIndex,
        totalModules: modulesOrdered.length,
      })

      selected = sanitizeVideoComponents(selected, {
        allowExternalVideo: !noExternal,
        verifiedWatchUrl: verifiedVideo?.url ?? null,
      })

      for (const c of selected) {
        recentComponentTypes.push(c.type)
        courseComponentCounts[c.type] = (courseComponentCounts[c.type] ?? 0) + 1
        telemetryComponents.push(c.type)
      }

      telemetryArchetypes.push((resolvedEntry.archetype ?? 'cold-open') as string)

      const interactiveElements =
        selected.length > 0 ? toInteractiveElements(selected, resolvedEntry.bloomLevel) : []

      const parsedSections = parseMarkdownSections(content)
      const imageIndices = pickImageSectionIndices(parsedSections.length, modIndex)
      const sectionImages = new Map<number, NonNullable<Awaited<ReturnType<typeof getOneImage>>>>()
      for (let imgIdx = 0; imgIdx < imageIndices.length; imgIdx++) {
        const secIdx = imageIndices[imgIdx]!
        const heading = parsedSections[secIdx]?.heading ?? ''
        const query =
          imgIdx === 0 ? mod.title : `${mod.title} ${heading}`.slice(0, 100)
        const imageResult = await getOneImage(query, course.title)
        if (imageResult) sectionImages.set(secIdx, imageResult)
      }

      const sections = parsedSections.map((sec, i) => ({
        heading: sec.heading,
        content: sec.content,
        type: 'text' as const,
        ...(sectionImages.has(i) ? { image: sectionImages.get(i)! } : {}),
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

  const baseSettings =
    course.settings && typeof course.settings === 'object' ? { ...(course.settings as Record<string, unknown>) } : {}
  const prevAg =
    baseSettings.ai_generation && typeof baseSettings.ai_generation === 'object'
      ? { ...(baseSettings.ai_generation as Record<string, unknown>) }
      : {}
  const mergedGen = { ...prevAg, ...(gen ?? {}) }
  await admin
    .from('courses')
    .update({
      settings: {
        ...baseSettings,
        ai_generation: {
          ...mergedGen,
          generation_telemetry: {
            completed_at: new Date().toISOString(),
            archetypes_used: telemetryArchetypes,
            component_types_used: telemetryComponents,
            critique_passes: critiquePasses,
          },
        },
      } as unknown as Json,
    })
    .eq('id', course.id)

  return { completed: true, modules_generated: generated }
}

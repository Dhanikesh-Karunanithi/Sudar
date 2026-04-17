import { createClient, createAdminClient } from '@/lib/supabase/server'
import { getOrgIdAndRole } from '@/lib/org'
import { NextRequest, NextResponse } from 'next/server'
import { chatCompletion, resolveChatConfigError } from '@/lib/ai/chat'
import { fetchStudioOrgAiContext } from '@/lib/ai/studioOrgAiChat'
import { generateSceneSpec } from '@shared-sudarart/generateSceneSpec'
import type { SudarArtChatMessage, SudarArtStylePreset } from '@shared-sudarart/generateSceneSpec'
import type { FullFigureTheme } from '@shared-sudarart/schema'

const STYLE_PRESETS: SudarArtStylePreset[] = [
  'auto',
  'bust',
  'portrait',
  'full-figure',
  'landscape',
  'grid',
  'scene',
]

function parseStyle(value: unknown): SudarArtStylePreset {
  if (typeof value === 'string' && STYLE_PRESETS.includes(value as SudarArtStylePreset)) {
    return value as SudarArtStylePreset
  }
  return 'auto'
}

const FIGURE_THEMES: FullFigureTheme[] = ['rounded', 'geometric', 'soft', 'outline', 'pixel']

function parseFigureTheme(value: unknown): FullFigureTheme | undefined {
  if (typeof value === 'string' && FIGURE_THEMES.includes(value as FullFigureTheme)) {
    return value as FullFigureTheme
  }
  return undefined
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { orgId } = await getOrgIdAndRole(user.id)
  const admin = createAdminClient()
  const { orgSettings, privateRuntime } = await fetchStudioOrgAiContext(admin, orgId)
  const configError = resolveChatConfigError(orgSettings, privateRuntime)
  if (configError) return NextResponse.json({ error: configError }, { status: 500 })
  const chatAiCtx = { privateOpenAi: privateRuntime }

  const body = await request.json()
  const prompt = typeof body?.prompt === 'string' ? body.prompt.trim() : ''
  if (!prompt) return NextResponse.json({ error: 'prompt required' }, { status: 400 })
  const style = parseStyle(body?.style)
  const figureTheme = parseFigureTheme(body?.figureTheme)

  try {
    const spec = await generateSceneSpec(
      prompt,
      async (messages: SudarArtChatMessage[]) => {
        const { content } = await chatCompletion(
          {
            messages,
            max_tokens: 2048,
            temperature: 0.7,
            response_format: { type: 'json_object' },
          },
          chatAiCtx
        )
        return content
      },
      { style, figureTheme }
    )

    return NextResponse.json(spec)
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'SudarArt generation failed' },
      { status: 500 }
    )
  }
}

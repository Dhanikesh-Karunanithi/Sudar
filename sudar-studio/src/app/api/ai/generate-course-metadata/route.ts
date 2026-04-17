import { createClient, createAdminClient } from '@/lib/supabase/server'
import { getOrCreateOrg } from '@/lib/org'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { resolveChatConfigError } from '@/lib/ai/chat'
import { fetchStudioOrgAiContext } from '@/lib/ai/studioOrgAiChat'
import { generateCourseMetadata } from '@/lib/ai/courseGeneration/courseMetadata'

const bodySchema = z.object({
  title: z.string().min(1),
  brief: z.string().nullable().optional(),
  difficulty: z.string().optional(),
  target_audience: z.string().optional(),
  learning_outcomes: z.array(z.string()).optional(),
  tone: z.string().optional(),
  industry: z.string().optional(),
  document_excerpt: z.string().optional(),
})

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const admin = createAdminClient()
  const orgId = await getOrCreateOrg(user.id)
  const { orgSettings, privateRuntime } = await fetchStudioOrgAiContext(admin, orgId)
  const configError = resolveChatConfigError(orgSettings, privateRuntime)
  if (configError) return NextResponse.json({ error: configError }, { status: 500 })

  const json = await request.json().catch(() => null)
  const parsed = bodySchema.safeParse(json)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid body', details: parsed.error.flatten() }, { status: 400 })
  }

  const b = parsed.data
  try {
    const meta = await generateCourseMetadata(
      {
        title: b.title,
        brief: b.brief ?? undefined,
        difficulty: b.difficulty,
        target_audience: b.target_audience,
        learning_outcomes: b.learning_outcomes,
        tone: b.tone,
        industry: b.industry,
        document_excerpt: b.document_excerpt,
      },
      { privateOpenAi: privateRuntime }
    )
    return NextResponse.json({
      success: true,
      description: meta.description,
      tag_labels: meta.tag_labels,
    })
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Metadata generation failed'
    return NextResponse.json({ success: false, error: message }, { status: 502 })
  }
}

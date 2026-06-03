import { createServiceRoleSupabaseClient } from '@/lib/supabase/server'
import { getRequestSession } from '@/lib/auth/requestSession'
import { getOrgIdAndRole } from '@/lib/org'
import { NextRequest, NextResponse } from 'next/server'
import { chatCompletion, resolveChatConfigError } from '@/lib/ai/chat'
import { fetchStudioOrgAiContext, studioMeteringChatCtx } from '@/lib/ai/studioOrgAiChat'

export async function POST(request: NextRequest) {
  const session = await getRequestSession(request)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { user } = session

  const { orgId } = await getOrgIdAndRole(user.id)
  const admin = createServiceRoleSupabaseClient()
  const { orgSettings, privateRuntime } = await fetchStudioOrgAiContext(admin, orgId)
  const configError = resolveChatConfigError(orgSettings, privateRuntime)
  if (configError) return NextResponse.json({ error: configError }, { status: 500 })
  const chatAiCtx = studioMeteringChatCtx(
    admin,
    orgId,
    user.id,
    orgSettings,
    privateRuntime,
    'course_generation',
    '/api/ai/generate-outline'
  )

  const { course_title, description, difficulty = 'intermediate', num_modules = 5 } = await request.json()
  if (!course_title) return NextResponse.json({ error: 'course_title required' }, { status: 400 })

  const userPrompt = `Create a course outline for:

Course title: "${course_title}"
${description ? `Description: ${description}` : ''}
Difficulty: ${difficulty}
Number of modules: ${num_modules}

Return ONLY a JSON array of module titles, nothing else. Example format:
["Introduction to the Topic", "Core Concepts", "Practical Applications", "Advanced Techniques", "Summary & Next Steps"]

Return only the JSON array:`

  try {
    const { content: raw } = await chatCompletion(
      {
        messages: [{ role: 'user', content: userPrompt }],
        max_tokens: 300,
        temperature: 0.6,
      },
      chatAiCtx
    )

    const match = raw?.match(/\[[\s\S]*\]/)
    if (!match) return NextResponse.json({ error: 'Could not parse outline', raw }, { status: 502 })

    const modules: string[] = JSON.parse(match[0])
    return NextResponse.json({ modules })
  } catch (err) {
    return NextResponse.json({ error: `Generation failed: ${err instanceof Error ? err.message : err}` }, { status: 500 })
  }
}

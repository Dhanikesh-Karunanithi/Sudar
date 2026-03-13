import { createClient, createAdminClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { getCourseContentForGeneration } from '@/lib/courseContentForGeneration'
import { chatCompletion, getChatConfigError } from '@/lib/ai/chat'

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const configError = getChatConfigError()
  if (configError) return NextResponse.json({ error: configError }, { status: 500 })

  let body: { courseId?: string } = {}
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const courseId = typeof body.courseId === 'string' ? body.courseId.trim() : ''
  if (!courseId) return NextResponse.json({ error: 'courseId required' }, { status: 400 })

  const admin = createAdminClient()
  const sampleText = await getCourseContentForGeneration(admin, courseId, user.id)

  if (!sampleText) {
    return NextResponse.json(
      { error: 'No sources available. Add course modules with content first.' },
      { status: 400 }
    )
  }

  const prompt = `Based on the following content, create a video script with scenes. Each scene should have:
- sceneNumber: Sequential number
- title: Scene title
- narration: What will be spoken
- visuals: Description of what should be shown
- duration: Estimated duration in seconds

Content:
${sampleText}

Create 5-8 scenes for a 3-5 minute video overview.

Return ONLY valid JSON in this format:
{
  "scenes": [
    {
      "sceneNumber": 1,
      "title": "Introduction",
      "narration": "Welcome to...",
      "visuals": "Show title card",
      "duration": 30
    }
  ]
}`

  try {
    const { content: raw } = await chatCompletion({
      messages: [
        { role: 'system', content: 'You are an expert video script writer. Always respond with valid JSON only, no additional text.' },
        { role: 'user', content: prompt },
      ],
      max_tokens: 3000,
      temperature: 0.7,
    })

    if (!raw) return NextResponse.json({ error: 'AI provider returned empty response' }, { status: 502 })

    let videoScript: { scenes: Array<{ sceneNumber: number; title: string; narration: string; visuals?: string; duration?: number }> }
    try {
      const jsonMatch = raw.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        videoScript = JSON.parse(jsonMatch[0])
      } else {
        throw new Error('No JSON found')
      }
    } catch {
      videoScript = {
        scenes: [
          {
            sceneNumber: 1,
            title: 'Introduction',
            narration: 'Welcome to this overview',
            visuals: 'Title card',
            duration: 30,
          },
        ],
      }
    }

    return NextResponse.json({
      type: 'video',
      script: videoScript,
      generatedAt: Date.now(),
    })
  } catch (error) {
    return NextResponse.json(
      {
        error: 'Failed to generate video overview',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

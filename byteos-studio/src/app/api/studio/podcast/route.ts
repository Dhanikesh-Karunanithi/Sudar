import { createClient, createAdminClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { getCourseContentForGeneration } from '@/lib/courseContentForGeneration'
import type { DialogueSegment } from '@/types/content'

const TOGETHER_API_URL = 'https://api.together.xyz/v1/chat/completions'
const MODEL = 'meta-llama/Llama-3.3-70B-Instruct-Turbo'

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const apiKey = process.env.TOGETHER_API_KEY
  if (!apiKey) return NextResponse.json({ error: 'TOGETHER_API_KEY not configured' }, { status: 500 })

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

  const prompt = `You are writing a podcast script for an educational course. You must produce a lively, engaging back-and-forth dialogue between exactly two speakers.

STRICT RULES — violating any of these will make the output unusable:
1. Speaker labels must be EXACTLY the string "host" (lowercase) or "expert" (lowercase). No other values. No names. No "Host:", no "Expert:", no character names.
2. The dialogue MUST strictly alternate: host, expert, host, expert, host, expert... Every single turn must switch speaker.
3. Produce between 22 and 28 segments total.
4. Each segment should be 2–5 sentences — conversational, not lecture-like. The host asks questions and makes observations; the expert explains, elaborates, and gives examples.
5. Output ONLY a JSON object with a single key "segments" containing an array. No extra text, no markdown, no explanation before or after the JSON.

EXAMPLE OF CORRECT OUTPUT (3 segments shown — your output must have 22–28):
{
  "segments": [
    {"speaker": "host", "text": "Welcome to the show! Today we're diving into something that affects every business — how teams actually get things done. I'm curious, where do most new managers go wrong right at the start?"},
    {"speaker": "expert", "text": "Great question! The biggest trap is thinking that being a manager means having all the answers. It doesn't. It means asking the right questions and creating the conditions for your team to succeed. A lot of new managers micromanage because they're afraid to let go."},
    {"speaker": "host", "text": "That makes a lot of sense. So it's less about control and more about trust? How do you actually build that trust with a team that might be skeptical of a new boss?"}
  ]
}

Now write 22–28 segments based on this course content:
${sampleText}

Remember: ONLY output the JSON object. Start your response with { and end with }.`

  try {
    const response = await fetch(TOGETHER_API_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          {
            role: 'system',
            content: 'You are a podcast script writer. Output ONLY valid JSON with no markdown, no explanations, no preamble. Start your response with { and end with }. Speaker labels must be exactly "host" or "expert" in lowercase.',
          },
          { role: 'user', content: prompt },
        ],
        max_tokens: 4500,
        temperature: 0.75,
        stop: null,
      }),
    })

    if (!response.ok) {
      const err = await response.text()
      return NextResponse.json({ error: `AI provider error: ${err}` }, { status: 502 })
    }

    const data = await response.json()
    const raw = (data.choices?.[0]?.message?.content ?? '').trim()

    let segments: DialogueSegment[] = []
    try {
      // Extract JSON object from the response (handles any stray text)
      const jsonMatch = raw.match(/\{[\s\S]*\}/)
      if (!jsonMatch) throw new Error('No JSON object found in response')
      const parsed = JSON.parse(jsonMatch[0]) as { segments?: Array<{ speaker?: string; text?: string }> }
      const rawSegments = Array.isArray(parsed.segments) ? parsed.segments : []

      segments = rawSegments
        .filter((s) => typeof s.text === 'string' && s.text.trim().length > 0)
        .map((s, i): DialogueSegment => ({
          // Strict: only "expert" maps to expert, everything else is host
          // Additionally enforce alternation if the LLM broke it
          speaker: (s.speaker ?? '').toLowerCase() === 'expert' ? 'expert' : 'host',
          text: (s.text ?? '').trim(),
        }))

      // Post-process: if alternation was broken, enforce it by flipping duplicates
      for (let i = 1; i < segments.length; i++) {
        if (segments[i].speaker === segments[i - 1].speaker) {
          segments[i] = {
            ...segments[i],
            speaker: segments[i].speaker === 'host' ? 'expert' : 'host',
          }
        }
      }
    } catch {
      // Fallback: minimal 4-segment dialogue
      segments = [
        { speaker: 'host', text: 'Welcome to the podcast! Today we explore the key ideas from this course. What would you say is the single most important concept learners should walk away with?' },
        { speaker: 'expert', text: 'Thanks for having me! The core idea is that understanding the fundamentals deeply always pays off more than jumping straight to advanced techniques. Let me walk you through why that matters.' },
        { speaker: 'host', text: 'That resonates a lot. Can you give us a concrete example from the course content that illustrates that principle in action?' },
        { speaker: 'expert', text: 'Absolutely. When you look at the material we covered, you can see this principle at work in almost every topic. The more time you spend on foundational understanding, the faster everything else clicks into place.' },
      ]
    }

    // Save dialogue directly to course settings
    const { data: course } = await admin
      .from('courses')
      .select('id, settings, created_by')
      .eq('id', courseId)
      .eq('created_by', user.id)
      .single()

    if (course) {
      const nextSettings = {
        ...(course.settings as Record<string, unknown> ?? {}),
        podcast_dialogue: segments,
        podcast_generation_status: 'script_ready' as const,
      }
      await admin.from('courses').update({ settings: nextSettings }).eq('id', courseId).eq('created_by', user.id)
    }

    return NextResponse.json({
      type: 'podcast',
      segments,
      count: segments.length,
      generatedAt: Date.now(),
    })
  } catch (error) {
    return NextResponse.json(
      {
        error: 'Failed to generate podcast',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { chatCompletion, getChatConfigError } from '@/lib/ai/chat'

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const configError = getChatConfigError()
  if (configError) return NextResponse.json({ error: configError }, { status: 500 })

  const body = await request.json()
  const text = typeof body?.text === 'string' ? body.text.trim() : ''
  const instruction = typeof body?.instruction === 'string' ? body.instruction.trim() : 'improve clarity'

  if (!text) return NextResponse.json({ error: 'text required' }, { status: 400 })

  const systemPrompt = `You are an editorial assistant. Given the user's selected text and optional instruction, return ONLY the revised text. No explanation, no preamble, no markdown. Just the revised text.`

  const userPrompt = instruction
    ? `Selected text:\n\n${text}\n\nInstruction: ${instruction}\n\nReturn only the revised text:`
    : `Selected text:\n\n${text}\n\nImprove it for clarity and concision. Return only the revised text:`

  try {
    const { content: revised } = await chatCompletion({
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      max_tokens: 500,
      temperature: 0.3,
    })

    if (!revised) return NextResponse.json({ error: 'No revision generated' }, { status: 502 })

    return NextResponse.json({ revised })
  } catch (err) {
    return NextResponse.json({ error: `Assist failed: ${err instanceof Error ? err.message : err}` }, { status: 500 })
  }
}

import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { chatCompletion, getChatConfigError } from '@/lib/ai/chat'

export interface FlashcardPair {
  front: string
  back: string
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const configError = getChatConfigError()
  if (configError) return NextResponse.json({ error: configError }, { status: 500 })

  const { content, module_title } = await request.json()
  const text = (content ?? '').trim().slice(0, 4000)
  if (!text) {
    return NextResponse.json(
      { cards: [], error: 'empty_content', message: 'No module text was provided to generate flashcards.' },
      { status: 400 }
    )
  }

  const prompt = `You are a learning designer. From the following module content, extract 4–8 flashcard pairs for study. Each pair: front = question or term (short), back = answer or definition (1–3 sentences). Output ONLY a JSON array of objects with keys "front" and "back". No markdown, no explanation.

Module title: ${module_title ?? 'Module'}

Content:
${text}

JSON array:`

  const { content: raw } = await chatCompletion({
    messages: [{ role: 'user', content: prompt }],
    max_tokens: 1200,
    temperature: 0.3,
  }).catch((err) => {
    throw new Error(err instanceof Error ? err.message : String(err))
  })
  const rawStr = raw ?? ''

  // Parse JSON array from response (may be wrapped in markdown code block)
  let jsonStr = rawStr
  const match = rawStr.match(/\[[\s\S]*\]/)
  if (match) jsonStr = match[0]

  let cards: FlashcardPair[] = []
  try {
    cards = JSON.parse(jsonStr)
    if (!Array.isArray(cards)) cards = []
    cards = cards
      .filter((c: unknown) => c && typeof c === 'object' && 'front' in c && 'back' in c)
      .map((c: { front?: string; back?: string }) => ({ front: String(c.front ?? '').slice(0, 300), back: String(c.back ?? '').slice(0, 500) }))
      .filter((c) => c.front.trim() && c.back.trim())
  } catch {
    cards = []
  }

  if (!cards.length) {
    return NextResponse.json({
      cards: [],
      error: 'generation_failed',
      message: 'Flashcards could not be generated from this content. Try again or switch to a different modality.',
    })
  }

  return NextResponse.json({ cards })
}

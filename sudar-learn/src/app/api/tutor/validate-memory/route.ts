import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

/** Predefined quick actions that map to memory keys. No LLM required for these. */
const QUICK_ACTIONS: Record<string, { key: string; value: string; summary: string; confirmLabel: string }> = {
  one_line: {
    key: 'preferred_response_length',
    value: 'one_line',
    summary: 'One-line answers by default',
    confirmLabel: 'Yes, give me one-line answers by default',
  },
  detailed: {
    key: 'preferred_response_length',
    value: 'detailed',
    summary: 'Detailed responses',
    confirmLabel: 'Yes, give me detailed responses',
  },
  concise: {
    key: 'preferred_response_length',
    value: 'concise',
    summary: 'Concise responses',
    confirmLabel: 'Yes, keep answers concise',
  },
  reading: {
    key: 'modality_preference',
    value: 'reading',
    summary: 'Prefer reading content',
    confirmLabel: 'Yes, I prefer reading',
  },
  listening: {
    key: 'modality_preference',
    value: 'listening',
    summary: 'Prefer listening to content',
    confirmLabel: 'Yes, I prefer listening',
  },
  video: {
    key: 'modality_preference',
    value: 'video',
    summary: 'Prefer video content',
    confirmLabel: 'Yes, I prefer video',
  },
  no_video: {
    key: 'modality_preference',
    value: 'no_video',
    summary: "I didn't like this type of video",
    confirmLabel: "Remember: I didn't like this type of video",
  },
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    let body: { message?: string; quick_action_key?: string }
    try {
      body = await request.json()
    } catch {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
    }

    const { quick_action_key, message } = body
    const key = quick_action_key?.trim() || (typeof message === 'string' ? message.trim().toLowerCase().replace(/\s+/g, '_').slice(0, 50) : '')

    const action = key ? QUICK_ACTIONS[key] : null
    if (!action) {
      return NextResponse.json({
        summary: 'Preference',
        confirmations: [],
        error: 'Unknown preference. Use one of: one_line, detailed, concise, reading, listening, video, no_video',
      })
    }

    const confirmations = [
      { key: action.key, value: action.value, label: action.confirmLabel },
      { key: '_cancel', value: 'cancel', label: 'Cancel' },
    ]

    return NextResponse.json({ summary: action.summary, confirmations })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

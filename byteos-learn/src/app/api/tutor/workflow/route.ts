/**
 * Start a batch workflow (e.g. summarize text, extract key terms).
 * Runs synchronously; returns workflow_id, status, steps, and result.
 */
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { chatCompletion, getDefaultMemoryModel, resolveChatConfigError } from '@/lib/ai/chat'
import { loadOrgAiChatContext } from '@/lib/org/orgAiChatContext'
import { scanSensitiveUserText } from '@/lib/security/sensitiveInputGuard'
import { parseOrgAiCompliance, type OrgAiCompliance } from '@/types/personalization'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const admin = createAdminClient()
    const { data: profForCompliance } = await admin
      .from('profiles')
      .select('org_id')
      .eq('id', user.id)
      .maybeSingle()
    let orgAiCompliance: OrgAiCompliance = {}
    if (profForCompliance?.org_id) {
      const { data: orgForCompliance } = await admin
        .from('organisations')
        .select('settings')
        .eq('id', profForCompliance.org_id)
        .maybeSingle()
      orgAiCompliance = parseOrgAiCompliance(orgForCompliance?.settings)
    }

    let body: { type?: string; text?: string } = {}
    try {
      body = await request.json()
    } catch {
      return NextResponse.json({ error: 'Invalid body' }, { status: 400 })
    }
    const { type = 'summarize', text } = body
    const inputText = (text ?? '').trim().slice(0, 15000)
    if (!inputText) return NextResponse.json({ error: 'text required' }, { status: 400 })

    if (orgAiCompliance.block_high_risk_pii_in_tutor !== false) {
      const sens = scanSensitiveUserText(inputText)
      if (sens.blocked) {
        return NextResponse.json(
          {
            error:
              "Can't process payment card numbers, government IDs, bank details, or private keys. Remove them and try again.",
            guardrail_code: 'sensitive_data_detected',
          },
          { status: 400 },
        )
      }
    }

    const { orgSettings, privateRuntime } = await loadOrgAiChatContext(admin, { userId: user.id })
    const cfgErr = resolveChatConfigError(orgSettings, privateRuntime)
    if (cfgErr) return NextResponse.json({ error: cfgErr }, { status: 500 })
    const chatCtx = { privateOpenAi: privateRuntime }

    const workflowId = crypto.randomUUID()
    const steps: string[] = []
    let result = ''
    let summary = ''

    if (type === 'summarize') {
      steps.push('Extract content')
      steps.push('Summarize')
      try {
        const { content: resContent } = await chatCompletion(
          {
            model: getDefaultMemoryModel(privateRuntime),
            messages: [
              {
                role: 'user',
                content: `Summarize the following text in 2–4 short paragraphs. Keep key points and structure.\n\n${inputText}`,
              },
            ],
            max_tokens: 500,
            temperature: 0.3,
          },
          chatCtx
        )
        result = resContent ?? ''
        summary = result.slice(0, 200) + (result.length > 200 ? '…' : '')
      } catch {
        return NextResponse.json({ workflow_id: workflowId, status: 'error', steps, summary: 'Summarization failed' })
      }
    } else if (type === 'extract_terms') {
      steps.push('Extract key terms')
      try {
        const { content: resContent } = await chatCompletion(
          {
            model: getDefaultMemoryModel(privateRuntime),
            messages: [
              {
                role: 'user',
                content: `List the key terms, concepts, or phrases from the following text. One per line, no numbering.\n\n${inputText}`,
              },
            ],
            max_tokens: 400,
            temperature: 0.2,
          },
          chatCtx
        )
        result = resContent ?? ''
        summary = result.slice(0, 200) + (result.length > 200 ? '…' : '')
      } catch {
        return NextResponse.json({ workflow_id: workflowId, status: 'error', steps, summary: 'Extraction failed' })
      }
    } else {
      return NextResponse.json({ error: 'Unknown workflow type' }, { status: 400 })
    }

    return NextResponse.json({
      workflow_id: workflowId,
      status: 'done',
      steps,
      current_step_index: steps.length,
      summary,
      result,
    })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

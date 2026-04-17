/**
 * Org-aware pre-LLM check for learner-triggered AI routes (modalities, audio, etc.).
 * Respects organisations.settings.ai_compliance.block_high_risk_pii_in_tutor (default: scan).
 */
import { NextResponse } from 'next/server'
import { scanSensitiveUserText } from '@/lib/security/sensitiveInputGuard'
import { parseOrgAiCompliance } from '@/types/personalization'

export const LEARNER_AI_SENSITIVE_MESSAGE =
  "This content can't be sent to AI because it may include payment or identity details. Remove sensitive information and try again."

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AdminClient = any

export async function rejectSensitiveLearnerAiInput(
  admin: AdminClient,
  userId: string,
  texts: Array<string | null | undefined>
): Promise<NextResponse | null> {
  const { data: prof } = await admin.from('profiles').select('org_id').eq('id', userId).maybeSingle()
  let skipScan = false
  if (prof?.org_id) {
    const { data: orgRow } = await admin.from('organisations').select('settings').eq('id', prof.org_id).maybeSingle()
    const compliance = parseOrgAiCompliance(orgRow?.settings)
    if (compliance.block_high_risk_pii_in_tutor === false) skipScan = true
  }
  if (skipScan) return null

  for (const t of texts) {
    if (!t || !String(t).trim()) continue
    const r = scanSensitiveUserText(String(t))
    if (r.blocked) {
      return NextResponse.json(
        {
          error: 'sensitive_data_detected',
          message: LEARNER_AI_SENSITIVE_MESSAGE,
          guardrail_code: 'sensitive_data_detected',
        },
        { status: 400 }
      )
    }
  }
  return null
}

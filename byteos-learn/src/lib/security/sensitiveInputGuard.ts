/**
 * Pre-LLM checks for high-risk patterns (payment, identity hints).
 * Heuristic only — not a guarantee. Keep peer file in byteos-studio in sync.
 */

export type SensitiveDataReason =
  | 'payment_card'
  | 'us_ssn'
  | 'iban'
  | 'private_key'
  | 'access_key_id'

export interface SensitiveInputScanResult {
  blocked: boolean
  reason?: SensitiveDataReason
}

export function luhnCheck(digits: string): boolean {
  if (!/^\d+$/.test(digits) || digits.length < 13 || digits.length > 19) return false
  let sum = 0
  let alt = false
  for (let i = digits.length - 1; i >= 0; i--) {
    let n = parseInt(digits[i]!, 10)
    if (Number.isNaN(n)) return false
    if (alt) {
      n *= 2
      if (n > 9) n -= 9
    }
    sum += n
    alt = !alt
  }
  return sum % 10 === 0
}

function extractDigitRuns(text: string, minLen: number, maxLen: number): string[] {
  const digits = text.replace(/\D/g, '')
  const out: string[] = []
  for (let len = maxLen; len >= minLen; len--) {
    for (let i = 0; i + len <= digits.length; i++) {
      out.push(digits.slice(i, i + len))
    }
  }
  return out
}

function hasLuhnCardCandidate(text: string): boolean {
  const seen = new Set<string>()
  for (const run of extractDigitRuns(text, 13, 19)) {
    if (seen.has(run)) continue
    seen.add(run)
    if (luhnCheck(run)) return true
  }
  return false
}

const US_SSN_DASHED = /\b\d{3}-\d{2}-\d{4}\b/
const IBAN_LIKE = /\b[A-Z]{2}\d{2}[A-Z0-9]{4,30}\b/i
const PEM_BEGIN = /-----BEGIN\s+(RSA\s+)?PRIVATE\s+KEY-----/i
const AWS_ACCESS_KEY = /\bAKIA[0-9A-Z]{16}\b/

export function scanSensitiveUserText(text: string): SensitiveInputScanResult {
  const t = text.trim()
  if (!t) return { blocked: false }
  if (PEM_BEGIN.test(t)) return { blocked: true, reason: 'private_key' }
  if (AWS_ACCESS_KEY.test(t)) return { blocked: true, reason: 'access_key_id' }
  if (US_SSN_DASHED.test(t)) return { blocked: true, reason: 'us_ssn' }
  if (IBAN_LIKE.test(t)) return { blocked: true, reason: 'iban' }
  if (hasLuhnCardCandidate(t)) return { blocked: true, reason: 'payment_card' }
  return { blocked: false }
}

export function redactEchoedSensitiveDigits(text: string): string {
  if (!text) return text
  let out = text
  const digits = text.replace(/\D/g, '')
  if (digits.length < 13) return out
  for (let len = 19; len >= 13; len--) {
    for (let i = 0; i + len <= digits.length; i++) {
      const sub = digits.slice(i, i + len)
      if (!luhnCheck(sub)) continue
      const re = new RegExp(sub.split('').join('\\D*'), 'g')
      out = out.replace(re, '[redacted]')
    }
  }
  return out
}

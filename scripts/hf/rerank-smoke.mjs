#!/usr/bin/env node
/**
 * Smoke-test HF cross-encoder reranking.
 * Usage: node scripts/hf/rerank-smoke.mjs
 */
import { readFileSync, existsSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = resolve(__dirname, '../..')

function loadEnvFile(path) {
  if (!existsSync(path)) return
  for (const line of readFileSync(path, 'utf8').split('\n')) {
    const t = line.trim()
    if (!t || t.startsWith('#')) continue
    const i = t.indexOf('=')
    if (i < 0) continue
    const k = t.slice(0, i).trim()
    const v = t.slice(i + 1).trim().replace(/^["']|["']$/g, '')
    if (!process.env[k]) process.env[k] = v
  }
}

loadEnvFile(resolve(root, 'sudar-learn/.env.local'))

const apiKey = process.env.HUGGINGFACE_API_KEY?.trim()
if (!apiKey) {
  console.error('Set HUGGINGFACE_API_KEY')
  process.exit(1)
}

const model = process.env.HF_RERANK_MODEL?.trim() || 'BAAI/bge-reranker-v2-m3'
const query = 'security training for employees'
const passages = [
  'How to bake sourdough bread at home.',
  'Workplace cybersecurity awareness and phishing prevention.',
  'History of the Roman Empire.',
  'Employee data protection and password hygiene.',
  'Gardening tips for spring flowers.',
]

const base = process.env.HF_INFERENCE_BASE_URL?.trim()?.replace(/\/$/, '')
const url = base
  ? `${base}/models/${model}`
  : `https://api-inference.huggingface.co/models/${model}`

const res = await fetch(url, {
  method: 'POST',
  headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
  body: JSON.stringify({
    inputs: { source_sentence: query, sentences: passages },
  }),
})

if (!res.ok) {
  console.error('Rerank failed:', res.status, await res.text())
  process.exit(1)
}

const scores = await res.json()
if (!Array.isArray(scores)) {
  console.error('Unexpected response:', scores)
  process.exit(1)
}

const ranked = scores
  .map((score, i) => ({ i, score, text: passages[i].slice(0, 60) }))
  .sort((a, b) => b.score - a.score)

console.log('Query:', query)
console.log('Ranked:')
for (const r of ranked) {
  console.log(`  [${r.score.toFixed(4)}] ${r.text}…`)
}

const topIsRelevant = ranked[0].i === 1 || ranked[0].i === 3
console.log(topIsRelevant ? 'OK — security passage ranked first' : 'WARN — top result may be wrong (check model cold start)')
process.exit(0)

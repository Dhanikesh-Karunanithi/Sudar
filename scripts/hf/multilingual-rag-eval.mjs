#!/usr/bin/env node
/**
 * Lightweight multilingual retrieval eval using HF embeddings only.
 * Compares EN query vs FR query embedding similarity to FR/EN passage pairs.
 * Usage: node scripts/hf/multilingual-rag-eval.mjs
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

const model = process.env.HF_EMBED_MODEL?.trim() || 'BAAI/bge-m3'

function meanPool(matrix) {
  if (!matrix?.length) return []
  const dim = matrix[0].length
  const out = new Array(dim).fill(0)
  let n = 0
  for (const row of matrix) {
    for (let i = 0; i < dim; i++) out[i] += row[i]
    n++
  }
  return n ? out.map((v) => v / n) : []
}

function normalize(data) {
  if (!Array.isArray(data) || !data.length) return []
  if (typeof data[0] === 'number') return data
  if (Array.isArray(data[0])) return meanPool(data)
  return []
}

async function embed(text) {
  const res = await fetch(`https://router.huggingface.co/hf-inference/models/${model}`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ inputs: text }),
  })
  if (!res.ok) throw new Error(await res.text())
  return normalize(await res.json())
}

function cosine(a, b) {
  let dot = 0
  let na = 0
  let nb = 0
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i]
    na += a[i] * a[i]
    nb += b[i] * b[i]
  }
  return dot / (Math.sqrt(na) * Math.sqrt(nb) + 1e-9)
}

// Sample pairs inspired by baber/multilingual_mmlu (anatomy, FR)
const passages = {
  en: 'A lesion compressing the facial nerve at the stylomastoid foramen causes paralysis of the facial muscles.',
  fr: 'Une lésion provoquant une compression du nerf facial au niveau du foramen stylo-mastoïdien entraîne une paralysie des muscles faciaux.',
  enNoise: 'The history of ancient Roman aqueduct engineering.',
}

const queries = {
  en: 'facial nerve paralysis stylomastoid foramen',
  fr: 'paralysie du nerf facial foramen stylo-mastoïdien',
}

console.log(`Model: ${model}\n`)

const vecs = {}
for (const [k, t] of Object.entries({ ...passages, ...queries })) {
  vecs[k] = await embed(t)
  console.log(`Embedded ${k}: ${vecs[k].length} dims`)
}

function rankQuery(qKey, qVec) {
  const candidates = [
    { id: 'en', vec: vecs.en },
    { id: 'fr', vec: vecs.fr },
    { id: 'enNoise', vec: vecs.enNoise },
  ]
  return candidates
    .map((c) => ({ id: c.id, score: cosine(qVec, c.vec) }))
    .sort((a, b) => b.score - a.score)
}

for (const qKey of ['en', 'fr']) {
  const ranked = rankQuery(qKey, vecs[qKey])
  const top = ranked[0].id
  const expected = qKey === 'fr' ? 'fr' : 'en'
  const hit = top === expected
  console.log(`\nQuery [${qKey}] top=${top} (expected ${expected}) ${hit ? 'HIT' : 'MISS'}`)
  ranked.forEach((r) => console.log(`  ${r.id}: ${r.score.toFixed(4)}`))
}

console.log('\nDone. For full MMLU eval, ingest baber/multilingual_mmlu passages into content_chunks.')

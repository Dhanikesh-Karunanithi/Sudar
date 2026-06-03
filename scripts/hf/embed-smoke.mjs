#!/usr/bin/env node
/**
 * Smoke-test HF embeddings (EN + FR) — expects 1024-dim vectors.
 * Usage: node scripts/hf/embed-smoke.mjs
 * Env: HUGGINGFACE_API_KEY, optional HF_EMBED_MODEL, HF_INFERENCE_BASE_URL
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
loadEnvFile(resolve(root, 'sudar-learn/.env'))

const apiKey = process.env.HUGGINGFACE_API_KEY?.trim()
if (!apiKey) {
  console.error('Set HUGGINGFACE_API_KEY in sudar-learn/.env.local')
  process.exit(1)
}

const model = process.env.HF_EMBED_MODEL?.trim() || process.env.EMBED_MODEL?.trim() || 'BAAI/bge-m3'
const base = process.env.HF_INFERENCE_BASE_URL?.trim()?.replace(/\/$/, '')
const expectedDim = 1024

function meanPool(matrix) {
  if (!matrix?.length) return []
  const dim = matrix[0].length
  const out = new Array(dim).fill(0)
  let n = 0
  for (const row of matrix) {
    if (!Array.isArray(row) || row.length !== dim) continue
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

async function embedViaRouter(text) {
  const url = `https://router.huggingface.co/hf-inference/models/${model}`
  const res = await fetch(url, {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ inputs: text }),
  })
  if (!res.ok) throw new Error(`Router ${res.status}: ${await res.text()}`)
  return normalize(await res.json())
}

async function embedViaOpenAi(text) {
  const url = `${base}/v1/embeddings`
  const res = await fetch(url, {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ model, input: text }),
  })
  if (!res.ok) throw new Error(`OpenAI-compat ${res.status}: ${await res.text()}`)
  const data = await res.json()
  return data.data?.[0]?.embedding ?? []
}

async function embed(text) {
  if (base) {
    const v = await embedViaOpenAi(text)
    if (v.length === expectedDim) return v
  }
  return embedViaRouter(text)
}

const samples = [
  { lang: 'EN', text: 'Corporate security awareness training for new hires.' },
  { lang: 'FR', text: 'Formation en cybersécurité pour les nouveaux employés.' },
]

let ok = true
for (const { lang, text } of samples) {
  try {
    const vec = await embed(text)
    const pass = vec.length === expectedDim
    console.log(`${lang}: dim=${vec.length} ${pass ? 'OK' : 'FAIL'}`)
    if (!pass) ok = false
  } catch (e) {
    console.error(`${lang}: ERROR`, e.message)
    ok = false
  }
}

process.exit(ok ? 0 : 1)

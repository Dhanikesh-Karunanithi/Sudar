#!/usr/bin/env node
/**
 * Smoke-test Learn RAG: embed query + optional Supabase match_content_chunks.
 * Usage: node scripts/hf/rag-retrieval-smoke.mjs "your search query"
 * Env: HUGGINGFACE_API_KEY, NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
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

const query = process.argv[2] || 'security awareness training'
const apiKey = process.env.HUGGINGFACE_API_KEY?.trim()
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim()
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim()

if (!apiKey) {
  console.error('Set HUGGINGFACE_API_KEY')
  process.exit(1)
}

// Reuse embed-smoke logic inline
const model = process.env.HF_EMBED_MODEL?.trim() || 'BAAI/bge-m3'
const embedRes = await fetch(`https://router.huggingface.co/hf-inference/models/${model}`, {
  method: 'POST',
  headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
  body: JSON.stringify({ inputs: query }),
})
if (!embedRes.ok) {
  console.error('Embed failed:', await embedRes.text())
  process.exit(1)
}
const raw = await embedRes.json()
let embedding = Array.isArray(raw?.[0]) ? raw[0] : raw
if (Array.isArray(embedding?.[0])) {
  const dim = embedding[0].length
  const out = new Array(dim).fill(0)
  for (const row of embedding) {
    for (let i = 0; i < dim; i++) out[i] += row[i]
  }
  embedding = out.map((v) => v / embedding.length)
}
console.log(`Query embedding: ${embedding.length} dims`)

if (!supabaseUrl || !serviceKey) {
  console.log('Skip DB: set NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY for match_content_chunks test')
  process.exit(embedding.length === 1024 ? 0 : 1)
}

const rpcUrl = `${supabaseUrl.replace(/\/$/, '')}/rest/v1/rpc/match_content_chunks`
const dbRes = await fetch(rpcUrl, {
  method: 'POST',
  headers: {
    apikey: serviceKey,
    Authorization: `Bearer ${serviceKey}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    query_embedding: embedding,
    match_count: 5,
    filter_course_id: null,
    filter_chunk_type: null,
  }),
})

if (!dbRes.ok) {
  console.error('RPC failed:', dbRes.status, await dbRes.text())
  console.log('Hint: apply sudar-learn/supabase/migrations/20260101000000_content_chunks_rag.sql and POST /api/rag/ingest')
  process.exit(1)
}

const rows = await dbRes.json()
console.log(`Retrieved ${rows.length} chunks:`)
for (const r of rows.slice(0, 5)) {
  console.log(`  sim=${(r.similarity ?? 0).toFixed(3)} type=${r.chunk_type} ${(r.content ?? '').slice(0, 80)}…`)
}
process.exit(rows.length > 0 ? 0 : 1)

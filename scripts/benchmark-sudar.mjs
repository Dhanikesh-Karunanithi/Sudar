#!/usr/bin/env node
/**
 * Sudar benchmark harness — latency for Intelligence HTTP paths and
 * in-process next-action ranking heuristic (catalog size N).
 *
 * Usage (repo root):
 *   node scripts/benchmark-sudar.mjs
 *   npm run benchmark:sudar
 *
 * Env:
 *   SUDAR_INTELLIGENCE_URL | BYTEOS_INTELLIGENCE_URL — default http://127.0.0.1:8001
 *   INTELLIGENCE_SERVICE_SECRET — optional; enables POST /api/tutor/query timing
 *   BENCHMARK_SAMPLES — default 20
 *   BENCHMARK_CATALOG_N — default 1000 (ranking microbench)
 */
import { writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '..')
const outPath = join(repoRoot, 'docs/research/benchmark-results.json')

const samples = Number(process.env.BENCHMARK_SAMPLES || 20)
const catalogN = Number(process.env.BENCHMARK_CATALOG_N || 1000)
const intelligenceBase = (
  process.env.SUDAR_INTELLIGENCE_URL ||
  process.env.BYTEOS_INTELLIGENCE_URL ||
  'http://127.0.0.1:8001'
).replace(/\/$/, '')

function percentile(sorted, p) {
  if (sorted.length === 0) return null
  const idx = Math.min(sorted.length - 1, Math.ceil((p / 100) * sorted.length) - 1)
  return sorted[Math.max(0, idx)]
}

function stats(msList) {
  const sorted = [...msList].sort((a, b) => a - b)
  return {
    n: sorted.length,
    p50_ms: percentile(sorted, 50),
    p95_ms: percentile(sorted, 95),
    min_ms: sorted[0] ?? null,
    max_ms: sorted[sorted.length - 1] ?? null,
  }
}

const FETCH_TIMEOUT_MS = Number(process.env.BENCHMARK_FETCH_TIMEOUT_MS || 3000)

async function timeFetch(url, init) {
  const t0 = performance.now()
  const res = await fetch(url, {
    ...init,
    signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
  })
  const elapsed = performance.now() - t0
  const text = await res.text().catch(() => '')
  return { elapsed, status: res.status, ok: res.ok, preview: text.slice(0, 120) }
}

async function benchmarkHealth() {
  const url = `${intelligenceBase}/api/health`
  const times = []
  let lastError = null
  for (let i = 0; i < samples; i++) {
    try {
      const { elapsed, ok, status } = await timeFetch(url)
      if (ok) times.push(elapsed)
      else lastError = `HTTP ${status}`
    } catch (e) {
      lastError = e instanceof Error ? e.message : String(e)
      break
    }
  }
  return {
    endpoint: '/api/health',
    base_url: intelligenceBase,
    ...stats(times),
    error: times.length ? null : lastError,
  }
}

async function benchmarkTutor() {
  const secret = process.env.INTELLIGENCE_SERVICE_SECRET
  if (!secret) {
    return {
      endpoint: '/api/tutor/query',
      skipped: true,
      reason: 'INTELLIGENCE_SERVICE_SECRET not set',
    }
  }
  const url = `${intelligenceBase}/api/tutor/query`
  const body = {
    user_id: '00000000-0000-4000-8000-000000000001',
    module_id: '00000000-0000-4000-8000-000000000002',
    course_id: '00000000-0000-4000-8000-000000000003',
    message: 'Benchmark: reply in one short sentence.',
    context_text: 'Sudar benchmark module content for latency measurement.',
    session_history: [],
  }
  const times = []
  let lastError = null
  for (let i = 0; i < Math.min(samples, 5); i++) {
    try {
      const { elapsed, ok, status, preview } = await timeFetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Intelligence-Service-Secret': secret,
        },
        body: JSON.stringify(body),
      })
      if (ok) times.push(elapsed)
      else lastError = `HTTP ${status}: ${preview}`
    } catch (e) {
      lastError = e instanceof Error ? e.message : String(e)
      break
    }
  }
  return {
    endpoint: '/api/tutor/query',
    ...stats(times),
    error: times.length ? null : lastError,
    skipped: times.length === 0,
  }
}

/** Cosine-like scoring over N synthetic course vectors (mirrors ranking hot path). */
function benchmarkRanking() {
  const dim = 32
  const profile = Array.from({ length: dim }, (_, i) => Math.sin(i * 0.3))
  const norm = Math.hypot(...profile) || 1
  const courses = Array.from({ length: catalogN }, (_, c) =>
    Array.from({ length: dim }, (_, i) => Math.cos((c + i) * 0.17)),
  )
  const times = []
  for (let run = 0; run < samples; run++) {
    const t0 = performance.now()
    let best = -Infinity
    for (const vec of courses) {
      let dot = 0
      let vnorm = 0
      for (let i = 0; i < dim; i++) {
        dot += profile[i] * vec[i]
        vnorm += vec[i] * vec[i]
      }
      const score = dot / (norm * Math.sqrt(vnorm) || 1)
      if (score > best) best = score
    }
    times.push(performance.now() - t0)
  }
  return {
    component: 'next_action_ranking_heuristic',
    catalog_n: catalogN,
    ...stats(times),
  }
}

async function main() {
  const started = new Date().toISOString()
  const health = await benchmarkHealth()
  const tutor = await benchmarkTutor()
  const ranking = benchmarkRanking()

  const report = {
    generated_at: started,
    environment: {
      node: process.version,
      intelligence_base: intelligenceBase,
      samples,
      catalog_n: catalogN,
    },
    results: { health, tutor, ranking },
  }

  writeFileSync(outPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8')
  console.log(JSON.stringify(report, null, 2))
  console.log(`\nWrote ${outPath}`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})

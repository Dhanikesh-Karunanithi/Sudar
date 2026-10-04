#!/usr/bin/env node
/**
 * Content quality eval: golden set (scripts/evals/golden/content-golden.json) against the
 * deterministic checks and, when a provider key is available, the LLM judge.
 *
 *   npm run eval:content            # deterministic + judge (if TOGETHER/OPENROUTER/OPENAI key found)
 *   npm run eval:content -- --no-judge
 *
 * Keys are read from the environment, falling back to sudar-studio/.env.local (never printed).
 */
import { spawnSync } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..')
const studio = path.join(root, 'sudar-studio')
const KEYS = ['TOGETHER_API_KEY', 'OPENROUTER_API_KEY', 'OPENAI_API_KEY', 'EVAL_JUDGE_MODEL']

function loadEnvLocal() {
  const file = path.join(studio, '.env.local')
  if (!existsSync(file)) return {}
  const out = {}
  for (const line of readFileSync(file, 'utf8').split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/)
    if (!m || !KEYS.includes(m[1])) continue
    out[m[1]] = m[2].replace(/^['"]|['"]$/g, '')
  }
  return out
}

const noJudge = process.argv.includes('--no-judge')
const env = { ...loadEnvLocal(), ...process.env }
const hasKey = KEYS.slice(0, 3).some((k) => env[k])
if (!noJudge) env.EVAL_JUDGE = '1'

process.stdout.write(
  `Content eval: deterministic checks${!noJudge && hasKey ? ' + LLM judge calibration' : ' only (no provider key or --no-judge)'}\n`,
)

const result = spawnSync('npx', ['vitest', 'run', 'src/lib/ai/courseGeneration/contentEval.test.ts'], {
  cwd: studio,
  env,
  stdio: 'inherit',
  shell: process.platform === 'win32',
})
process.exit(result.status ?? 1)

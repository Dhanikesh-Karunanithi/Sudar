#!/usr/bin/env node
/**
 * Start the full Sudar stack locally with one command and an env preflight.
 *
 *   node scripts/dev-all.mjs --check          # env report only, exit 1 if a required var is missing
 *   node scripts/dev-all.mjs                  # studio + learn + intelligence (+ sudarvid, sudar-sim, livekit when configured)
 *   node scripts/dev-all.mjs --only=learn,intelligence
 *   node scripts/dev-all.mjs --no-vid --no-voice
 *
 * Reuses a service if its health endpoint already answers.
 */
import { spawn, spawnSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const argv = process.argv.slice(2)
const flag = (name) => argv.includes(`--${name}`)
const onlyArg = argv.find((a) => a.startsWith('--only='))
const only = onlyArg ? new Set(onlyArg.slice('--only='.length).split(',').map((s) => s.trim())) : null
const isWin = process.platform === 'win32'
const python = process.env.SUDAR_PYTHON || (isWin ? 'python' : 'python3')

function readEnvFile(filePath) {
  const out = {}
  if (!fs.existsSync(filePath)) return out
  for (const line of fs.readFileSync(filePath, 'utf8').split(/\r?\n/)) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const eq = trimmed.indexOf('=')
    if (eq <= 0) continue
    let value = trimmed.slice(eq + 1).trim()
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1)
    }
    out[trimmed.slice(0, eq).trim()] = value
  }
  return out
}

function loadEnv(dir) {
  const abs = path.join(repoRoot, dir)
  return { ...readEnvFile(path.join(abs, '.env')), ...readEnvFile(path.join(abs, '.env.local')) }
}

const env = {
  studio: loadEnv('sudar-studio'),
  learn: loadEnv('sudar-learn'),
  intelligence: loadEnv('sudar-intelligence'),
  sim: loadEnv('sudar-sim'),
  vid: loadEnv('sudar_vid'),
}

const has = (scope, ...keys) => keys.some((k) => Boolean((process.env[k] || env[scope][k] || '').trim()))

/** required: app won't work. feature: named capability degrades when missing. */
const CHECKS = [
  { scope: 'studio', keys: ['NEXT_PUBLIC_SUPABASE_URL'], level: 'required' },
  { scope: 'studio', keys: ['NEXT_PUBLIC_SUPABASE_ANON_KEY'], level: 'required' },
  { scope: 'studio', keys: ['SUPABASE_SERVICE_ROLE_KEY'], level: 'required' },
  { scope: 'studio', keys: ['OPENROUTER_API_KEY', 'TOGETHER_API_KEY', 'OPENAI_API_KEY', 'ANTHROPIC_API_KEY'], level: 'required', note: 'at least one AI provider for course generation' },
  { scope: 'studio', keys: ['TOGETHER_API_KEY', 'OPENAI_API_KEY'], level: 'feature', note: 'content moderation (Llama Guard / OpenAI); falls back to local screen' },
  { scope: 'learn', keys: ['NEXT_PUBLIC_SUPABASE_URL'], level: 'required' },
  { scope: 'learn', keys: ['NEXT_PUBLIC_SUPABASE_ANON_KEY'], level: 'required' },
  { scope: 'learn', keys: ['SUPABASE_SERVICE_ROLE_KEY'], level: 'required' },
  { scope: 'learn', keys: ['OPENROUTER_API_KEY', 'TOGETHER_API_KEY', 'OPENAI_API_KEY', 'ANTHROPIC_API_KEY'], level: 'required', note: 'at least one AI provider for the tutor' },
  { scope: 'learn', keys: ['NEXT_PUBLIC_SUDAR_JOURNEY'], level: 'feature', note: 'SudarNotes (/journey): unset = on in dev, off in prod builds; set 1 to match beta' },
  { scope: 'learn', keys: ['SUDAR_SIM_URL'], level: 'feature', note: 'streaming voice sims (typed + push-to-talk still work)' },
  { scope: 'intelligence', keys: ['OPENROUTER_API_KEY', 'TOGETHER_API_KEY', 'OPENAI_API_KEY', 'ANTHROPIC_API_KEY'], level: 'required', note: 'at least one AI provider' },
  { scope: 'intelligence', keys: ['DEEPGRAM_API_KEY', 'HUGGINGFACE_API_KEY'], level: 'feature', note: 'speech-to-text for sims and SudarNotes voice' },
  { scope: 'intelligence', keys: ['CARTESIA_API_KEY'], level: 'feature', note: 'premium TTS (Edge TTS fallback is free)' },
  { scope: 'sim', keys: ['LIVEKIT_URL'], level: 'feature', note: 'streaming voice rooms' },
  { scope: 'sim', keys: ['DEEPGRAM_API_KEY'], level: 'feature', note: 'streaming STT in the voice agent' },
  { scope: 'sim', keys: ['CARTESIA_API_KEY'], level: 'feature', note: 'streaming TTS in the voice agent' },
]

function envReport() {
  let missingRequired = 0
  const rows = []
  for (const c of CHECKS) {
    const ok = has(c.scope, ...c.keys)
    if (!ok && c.level === 'required') missingRequired += 1
    const status = ok ? 'ok     ' : c.level === 'required' ? 'MISSING' : 'off    '
    rows.push(`  ${status} ${c.scope.padEnd(12)} ${c.keys.join(' | ')}${c.note ? `  (${c.note})` : ''}`)
  }
  console.log('\nSudar env preflight (reads each app .env / .env.local and your shell):')
  console.log(rows.join('\n'))
  const voiceReady = has('sim', 'LIVEKIT_URL') && has('sim', 'DEEPGRAM_API_KEY') && has('sim', 'CARTESIA_API_KEY')
  console.log(`\n  Streaming voice: ${voiceReady ? 'ready' : 'not configured (sims fall back to push-to-talk / typed)'}`)
  console.log(missingRequired ? `\n  ${missingRequired} required value(s) missing. See docs/ENV_REFERENCE.md and docs/LOCAL_DEV.md.\n` : '\n  All required values present.\n')
  return { missingRequired, voiceReady }
}

async function healthy(url) {
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(1500) })
    return res.ok
  } catch {
    return false
  }
}

const children = []
function start(label, command, args, cwd, extraEnv = {}) {
  const child = spawn(command, args, {
    cwd: path.join(repoRoot, cwd),
    shell: isWin,
    env: { ...process.env, ...extraEnv },
    stdio: ['ignore', 'pipe', 'pipe'],
  })
  const prefix = `[${label}]`.padEnd(15)
  const pipe = (stream, out) =>
    stream.on('data', (buf) => {
      for (const line of buf.toString().split(/\r?\n/)) if (line.trim()) out.write(`${prefix}${line}\n`)
    })
  pipe(child.stdout, process.stdout)
  pipe(child.stderr, process.stderr)
  child.on('exit', (code) => console.log(`${prefix}exited with code ${code}`))
  children.push(child)
  return child
}

const wants = (name) => (only ? only.has(name) : true)

async function main() {
  const { missingRequired, voiceReady } = envReport()
  if (flag('check')) process.exit(missingRequired ? 1 : 0)
  if (missingRequired && !flag('force')) {
    console.error('Refusing to start with missing required env. Fix the values above or pass --force.')
    process.exit(1)
  }

  const intelligenceUrl = 'http://localhost:8001'
  const serviceSecret =
    process.env.INTELLIGENCE_SERVICE_SECRET ||
    env.learn.INTELLIGENCE_SERVICE_SECRET ||
    env.intelligence.INTELLIGENCE_SERVICE_SECRET ||
    'sudar-local-dev-secret'
  const simSecret = env.learn.SUDAR_SIM_SERVICE_SECRET || env.sim.SUDAR_SIM_SERVICE_SECRET || 'dev-sim-secret-change-me'
  const shared = {
    SUDAR_INTELLIGENCE_URL: intelligenceUrl,
    BYTEOS_INTELLIGENCE_URL: intelligenceUrl,
    INTELLIGENCE_SERVICE_SECRET: serviceSecret,
  }

  if (wants('intelligence')) {
    if (await healthy(`${intelligenceUrl}/api/health`)) console.log('[intelligence] reusing running service on :8001')
    else start('intelligence', python, ['-m', 'uvicorn', 'src.api.main:app', '--reload', '--port', '8001'], 'sudar-intelligence', shared)
  }

  if (wants('vid') && !flag('no-vid')) {
    if (await healthy('http://localhost:8000/health')) console.log('[sudarvid] reusing running service on :8000')
    else start('sudarvid', python, ['-m', 'uvicorn', 'sudarvid.server:app', '--reload', '--port', '8000'], 'sudar_vid')
  }

  const runVoice = wants('sim') && !flag('no-voice') && voiceReady
  if (runVoice) {
    const docker = spawnSync('docker', ['version', '--format', '{{.Server.Version}}'], { shell: isWin, stdio: 'ignore' })
    if (docker.status === 0) {
      spawnSync('docker', ['compose', '-f', 'sudar-sim/docker-compose.livekit.yml', 'up', '-d'], { cwd: repoRoot, shell: isWin, stdio: 'inherit' })
    } else {
      console.warn('[livekit] Docker not available; start LiveKit yourself or point LIVEKIT_URL at LiveKit Cloud.')
    }
    if (await healthy('http://localhost:8090/health')) console.log('[sudar-sim] reusing running service on :8090')
    else start('sudar-sim', python, ['-m', 'uvicorn', 'main:app', '--reload', '--port', '8090'], 'sudar-sim', {
      ...shared,
      SUDAR_LEARN_URL: 'http://localhost:3001',
      SUDAR_SIM_SERVICE_SECRET: simSecret,
    })
  } else if (wants('sim') && !flag('no-voice')) {
    console.log('[sudar-sim] skipped: streaming voice keys not configured (typed and push-to-talk sims still work).')
  }

  if (wants('studio')) start('studio', 'node', ['./scripts/run-next.mjs', 'dev'], 'sudar-studio', shared)
  if (wants('learn')) {
    start('learn', 'npx', ['next', 'dev', '-p', '3001'], 'sudar-learn', {
      ...shared,
      ...(runVoice ? { SUDAR_SIM_URL: 'http://localhost:8090', SUDAR_SIM_SERVICE_SECRET: simSecret } : {}),
    })
  }

  console.log('\nStudio http://localhost:3000   Learn http://localhost:3001   Intelligence http://localhost:8001/docs\n')

  const shutdown = () => {
    for (const child of children) if (!child.killed) child.kill('SIGTERM')
    process.exit(0)
  }
  process.on('SIGINT', shutdown)
  process.on('SIGTERM', shutdown)
}

main().catch((err) => {
  console.error(`[dev-all] ${err instanceof Error ? err.message : String(err)}`)
  process.exit(1)
})

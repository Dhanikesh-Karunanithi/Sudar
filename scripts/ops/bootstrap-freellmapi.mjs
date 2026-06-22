#!/usr/bin/env node
/**
 * Bootstrap a self-hosted FreeLLMAPI instance for Sudar staging pilots.
 * Adapted from ByteVerse scripts/start-freellmapi.ps1 + bootstrap-freellmapi.ps1.
 *
 * Usage:
 *   node scripts/ops/bootstrap-freellmapi.mjs [--start]
 *
 * Env:
 *   FREELLMAPI_DIR — clone location (default: ../freellmapi next to repo root)
 *   FREELLMAPI_PORT — API port (default 3001)
 *   FREELLMAPI_ADMIN_EMAIL / FREELLMAPI_ADMIN_PASSWORD — dashboard account
 *   FREELLMAPI_BASE_URL — override base for bootstrap API calls (default http://localhost:PORT)
 */
import { spawn, execSync } from 'node:child_process'
import { randomBytes } from 'node:crypto'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const repoRoot = resolve(__dirname, '../..')
const freellmDir = process.env.FREELLMAPI_DIR
  ? resolve(process.env.FREELLMAPI_DIR)
  : join(repoRoot, '..', 'freellmapi')
const port = process.env.FREELLMAPI_PORT ?? '3001'
const base = (process.env.FREELLMAPI_BASE_URL ?? `http://localhost:${port}`).replace(/\/$/, '')
const adminEmail = process.env.FREELLMAPI_ADMIN_EMAIL ?? 'admin@sudar.local'
const adminPassword = process.env.FREELLMAPI_ADMIN_PASSWORD ?? 'sudar-pilot-2026'
const shouldStart = process.argv.includes('--start')

function run(cmd, cwd = freellmDir) {
  execSync(cmd, { cwd, stdio: 'inherit', shell: true })
}

function ensureClone() {
  if (existsSync(join(freellmDir, 'package.json'))) return
  mkdirSync(dirname(freellmDir), { recursive: true })
  console.log('Cloning FreeLLMAPI into', freellmDir)
  run(`git clone --depth 1 https://github.com/tashfeenahmed/freellmapi.git "${freellmDir}"`, repoRoot)
}

function ensureEnv() {
  const envPath = join(freellmDir, '.env')
  if (existsSync(envPath)) return
  const key = randomBytes(32).toString('hex')
  writeFileSync(
    envPath,
    `ENCRYPTION_KEY=${key}\nPORT=${port}\n`,
    'utf8'
  )
  console.log('Created', envPath)
}

function ensureDeps() {
  if (!existsSync(join(freellmDir, 'node_modules'))) {
    run('npm install')
  }
}

async function waitForHealth(maxAttempts = 60) {
  for (let i = 0; i < maxAttempts; i++) {
    try {
      const res = await fetch(`${base}/health`)
      if (res.ok) return
    } catch {
      // retry
    }
    await new Promise((r) => setTimeout(r, 1000))
  }
  throw new Error(`FreeLLMAPI did not become healthy at ${base}/health`)
}

async function getDashboardToken() {
  const setupBody = JSON.stringify({ email: adminEmail, password: adminPassword })
  let res = await fetch(`${base}/api/auth/setup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: setupBody,
  })
  if (res.ok) {
    const data = await res.json()
    return data.token
  }
  res = await fetch(`${base}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: setupBody,
  })
  if (!res.ok) {
    throw new Error(`Auth failed: ${res.status} ${await res.text()}`)
  }
  const data = await res.json()
  return data.token
}

async function registerProviders(token) {
  const headers = {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  }
  for (const platform of ['kilo', 'llm7', 'pollinations']) {
    const payload = { platform, label: 'Sudar' }
    if (platform !== 'kilo') payload.key = 'anonymous'
    try {
      const res = await fetch(`${base}/api/keys`, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
      })
      if (res.ok) {
        console.log('Registered upstream:', platform)
      } else {
        console.log('Skipped', platform, '(may already exist):', res.status)
      }
    } catch (err) {
      console.log('Skipped', platform, String(err))
    }
  }
}

function printStagingEnv() {
  console.log('\n--- Staging env (Vercel sudar-studio + sudar-learn) ---')
  console.log(`FREELLMAPI_BASE_URL=${base}/v1`)
  console.log('FREELLMAPI_API_KEY=<copy unified key from FreeLLMAPI server log on first start>')
  console.log('ALLOW_ORG_PLATFORM_AI=true')
  console.log('ADMIN_EMAILS=connect@dhanikeshkarunanithi.com,dhanikeshkarunanithi@foundever.com')
  console.log('EARLY_ACCESS_ENABLED=true')
  console.log('\nAlso keep TOGETHER_API_KEY as fallback.')
}

async function main() {
  ensureClone()
  ensureEnv()
  ensureDeps()

  if (shouldStart) {
    console.log(`Starting FreeLLMAPI on ${base} ...`)
    const child = spawn('npm', ['run', 'dev'], {
      cwd: freellmDir,
      stdio: 'inherit',
      shell: true,
    })
    child.on('error', (err) => {
      console.error(err)
      process.exit(1)
    })
    await waitForHealth()
  } else {
    console.log('Skipping server start (pass --start to launch). Checking health at', base)
    try {
      const res = await fetch(`${base}/health`)
      if (!res.ok) throw new Error(String(res.status))
    } catch {
      console.error('FreeLLMAPI is not running. Start it with:')
      console.error('  node scripts/ops/bootstrap-freellmapi.mjs --start')
      process.exit(1)
    }
  }

  const token = await getDashboardToken()
  await registerProviders(token)
  printStagingEnv()
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})

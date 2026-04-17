#!/usr/bin/env node
import { spawn, spawnSync } from 'node:child_process'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const repoRoot = path.resolve(__dirname, '..')

const appTarget = process.argv[2]

if (!appTarget || (appTarget !== 'learn' && appTarget !== 'studio')) {
  console.error('Usage: node scripts/dev-with-sudarvid.mjs <learn|studio> [extra args]')
  process.exit(1)
}

const extraArgs = process.argv.slice(3)
const sudarVidUrl = (process.env.SUDARVID_URL || 'http://localhost:8000').replace(/\/$/, '')
const intelligenceUrl = (process.env.BYTEOS_INTELLIGENCE_URL || 'http://localhost:8001').replace(/\/$/, '')
const intelligenceServiceSecret = process.env.INTELLIGENCE_SERVICE_SECRET || 'sudar-local-dev-secret'

function startProcess(command, args, cwd, label, envOverrides = {}) {
  const child = spawn(command, args, {
    cwd,
    shell: process.platform === 'win32',
    env: { ...process.env, ...envOverrides },
    stdio: 'inherit',
  })

  child.on('error', (err) => {
    console.error(`[${label}] Failed to start: ${err.message}`)
  })

  return child
}

function ensurePythonModule(pythonCommand, moduleName, cwd) {
  const check = spawnSync(pythonCommand, ['-c', `import ${moduleName}`], {
    cwd,
    shell: process.platform === 'win32',
    env: process.env,
    stdio: 'ignore',
  })
  return check.status === 0
}

function installPythonRequirements(pythonCommand, cwd, label) {
  console.log(`[${label}] Installing Python requirements...`)
  const install = spawnSync(pythonCommand, ['-m', 'pip', 'install', '-r', 'requirements.txt'], {
    cwd,
    shell: process.platform === 'win32',
    env: process.env,
    stdio: 'inherit',
  })
  if (install.status !== 0) {
    throw new Error(`[${label}] Failed to install requirements.txt`)
  }
}

async function isSudarVidHealthy() {
  try {
    const response = await fetch(`${sudarVidUrl}/health`)
    return response.ok
  } catch {
    return false
  }
}

async function isIntelligenceHealthy() {
  try {
    const response = await fetch(`${intelligenceUrl}/api/health`)
    return response.ok
  } catch {
    return false
  }
}

function getPort(urlString, fallbackPort) {
  try {
    const parsed = new URL(urlString)
    if (parsed.port) return parsed.port
    return parsed.protocol === 'https:' ? '443' : '80'
  } catch {
    return fallbackPort
  }
}

async function main() {
  const runningChildren = []
  let shuttingDown = false

  const appConfig =
    appTarget === 'learn'
      ? {
          cwd: path.join(repoRoot, 'sudar-learn'),
          cmd: 'next',
          args: ['dev', '-p', '3001', ...extraArgs],
          label: 'learn',
        }
      : {
          cwd: path.join(repoRoot, 'sudar-studio'),
          cmd: 'node',
          args: ['./scripts/run-next.mjs', 'dev', ...extraArgs],
          label: 'studio',
        }

  if (!(await isSudarVidHealthy())) {
    const sudarVidCwd = path.join(repoRoot, 'sudar_vid')
    const pythonCommand = process.env.SUDARVID_PYTHON || (process.platform === 'win32' ? 'python' : 'python3')
    if (!ensurePythonModule(pythonCommand, 'fastapi', sudarVidCwd)) {
      installPythonRequirements(pythonCommand, sudarVidCwd, 'sudarvid')
    }
    const sudarVidArgs = ['-m', 'uvicorn', 'sudarvid.server:app', '--reload', '--port', '8000']
    const sudarVidChild = startProcess(pythonCommand, sudarVidArgs, sudarVidCwd, 'sudarvid')
    runningChildren.push(sudarVidChild)
  } else {
    console.log(`[sudarvid] Reusing running service at ${sudarVidUrl}`)
  }

  if (!(await isIntelligenceHealthy())) {
    const intelligenceCwd = path.join(repoRoot, 'sudar-intelligence')
    const pythonCommand = process.env.INTELLIGENCE_PYTHON || (process.platform === 'win32' ? 'python' : 'python3')
    if (!ensurePythonModule(pythonCommand, 'slowapi', intelligenceCwd)) {
      installPythonRequirements(pythonCommand, intelligenceCwd, 'intelligence')
    }
    const intelligencePort = getPort(intelligenceUrl, '8001')
    const intelligenceArgs = ['-m', 'uvicorn', 'src.api.main:app', '--reload', '--port', intelligencePort]
    const intelligenceChild = startProcess(
      pythonCommand,
      intelligenceArgs,
      intelligenceCwd,
      'intelligence',
      { INTELLIGENCE_SERVICE_SECRET: intelligenceServiceSecret }
    )
    runningChildren.push(intelligenceChild)
  } else {
    console.log(`[intelligence] Reusing running service at ${intelligenceUrl}`)
  }

  const appChild = startProcess(
    appConfig.cmd,
    appConfig.args,
    appConfig.cwd,
    appConfig.label,
    {
      BYTEOS_INTELLIGENCE_URL: intelligenceUrl,
      INTELLIGENCE_SERVICE_SECRET: intelligenceServiceSecret,
    }
  )
  runningChildren.push(appChild)

  const shutdown = (signal) => {
    if (shuttingDown) return
    shuttingDown = true
    for (const child of runningChildren) {
      if (!child.killed) child.kill(signal)
    }
  }

  process.on('SIGINT', () => shutdown('SIGINT'))
  process.on('SIGTERM', () => shutdown('SIGTERM'))

  appChild.on('exit', (code) => {
    shutdown('SIGTERM')
    process.exit(code ?? 0)
  })
}

main().catch((err) => {
  console.error(`[dev-with-sudarvid] ${err instanceof Error ? err.message : String(err)}`)
  process.exit(1)
})

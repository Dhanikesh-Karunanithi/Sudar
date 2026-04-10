/**
 * When distDir points at node_modules/.cache (Windows — avoids EPERM on .next/trace / Temp locks),
 * compiled server chunks still require("next/dist/..."). Node resolves from the chunk's directory
 * and never reaches this app's node_modules unless NODE_PATH includes it.
 */
import { spawnSync } from 'node:child_process'
import { createRequire } from 'node:module'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const studioRoot = path.dirname(path.dirname(fileURLToPath(import.meta.url)))
const nodeModules = path.join(studioRoot, 'node_modules')
const sep = path.delimiter
process.env.NODE_PATH = process.env.NODE_PATH
  ? `${nodeModules}${sep}${process.env.NODE_PATH}`
  : nodeModules

const require = createRequire(path.join(studioRoot, 'package.json'))
let nextCli
try {
  nextCli = require.resolve('next/dist/bin/next')
} catch {
  console.error(
    '[run-next] Could not resolve next/dist/bin/next — run npm install in byteos-studio.'
  )
  process.exit(1)
}

const args = process.argv.slice(2)
const result = spawnSync(process.execPath, [nextCli, ...args], {
  stdio: 'inherit',
  cwd: studioRoot,
  env: process.env,
  windowsHide: true,
})

process.exit(result.status === null ? 1 : result.status)

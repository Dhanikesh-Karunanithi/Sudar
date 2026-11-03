/**
 * OpenNext Cloudflare deploy. On Windows, force `.next` output so OpenNext finds middleware-manifest.json.
 */
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const root = path.dirname(fileURLToPath(import.meta.url))
const studioRoot = path.join(root, '..')

if (process.platform === 'win32') {
  process.env.NEXT_FORCE_PROJECT_DIST = '1'
}

function run(args) {
  const r = spawnSync('npx', ['opennextjs-cloudflare', ...args], {
    cwd: studioRoot,
    stdio: 'inherit',
    shell: true,
    env: process.env,
  })
  if (r.status !== 0) process.exit(r.status ?? 1)
}

// Next 15.5.x is past OpenNext's default support window; Studio/Learn already ship on it in prod.
run(['build', '--dangerouslyUseUnsupportedNextVersion'])
run(['deploy'])
